
const express = require('express');
const router = express.Router();
const request = require('superagent');
const refreshToken = require('../middleware/refreshToken.middleware');
const User = require('../models/userModel');
const Account = require('../models/ynabModel');
const errorParser = require('../helpers/errorsParserHelper');

const bodyParser = require('body-parser');

const morgan = require('morgan');
const mongoose = require('mongoose');

const {CLIENT_SECRET} = require('../../config');

const ynab = require('ynab');
let accessToken;

mongoose.Promise = global.Promise;

const app = express();

app.use(morgan('common'));
app.use(express.json());

router.get('/', (req, res) => {
    res.json({status: 'working'});
});

router.get('/budgets/:id', refreshToken, (req, res) => {
    return User
        .findById(req.params.id)
        .populate('account')
    .then((user) => retrieveBudgets(user.account.access_token))
    .then((budgets) =>res.json(budgets))   
    .catch(err => res.status(500).json(errorParser.generateErrorResponse(err)))
});

async function retrieveBudgets(accessToken){
    console.log('retrieve budgets ran');
    console.log(`accessToken: ${accessToken}`)
    const ynabAPI = new ynab.API(accessToken);
    const budgetList = []

    try{
        const budgetsResponse = await ynabAPI.budgets.getBudgets();
        const budgets = budgetsResponse.data.budgets;
        for (let budget of budgets){
            budgetList.push({label: budget.name,
                             value: budget.id})
        }
    } catch (e) {
        console.log(`error: ${JSON.stringify(e)}`);
    }

    console.log(`budget list: ${budgetList[0].label}`)
    return budgetList
}

router.get('/categories/:id',  refreshToken, (req, res) => {
    budgetID = req.query.budgetid;
    console.log('get categories')

    return User
        .findByIdAndUpdate(req.params.id, {$set: {budget_id: budgetID}})
        .populate('account')
        .then(function(account){
            console.log(`account: ${account}`)
            accessToken = account.account.access_token;
        })
    .then(function(){
        return retrieveCategories(budgetID)
    })
    .then(function(categories){
        res.json(categories);
    })   
    .catch(err => res.status(500).json(errorParser.generateErrorResponse(err)))
})

//.findByIdAndUpdate(req.params.id, {$set: {budget_id: budgetID}})

async function retrieveCategories(budgetID){
    console.log('retrieve categories')
    console.log(`budgetID: ${budgetID}`)
    console.log(`accessToken: ${accessToken}`)
    const ynabAPI = new ynab.API(accessToken);
    const categoryList = []

    try{
        const categoryResponse = await ynabAPI.categories.getCategories(budgetID)
        //console.log(`category response: ${categoryResponse}`);
        const categoryGroups = categoryResponse.data.category_groups;
        for (let categoryGroup of categoryGroups){
            let group = {
                name: categoryGroup.name,
                id: categoryGroup.id,
                categories: categoryGroup.categories
            }
            categoryList.push(group);
        }
    } catch (e) {
        console.log(`error: ${JSON.stringify(e)}`);
    }

    return categoryList
}

router.get('/category/:id', refreshToken, (req, res) => {
    console.log('req.params.id')
    return User
        .findById(req.params.id)
        .populate('account')
    .then(function(user){
        return retrieveBalance(user)
    })
    .then(function(balance){
        res.status(201).json({balance: balance});
    })   
    .catch(err => res.status(500).json(errorParser.generateErrorResponse(err)))

})

async function retrieveBalance(user){
    let accessToken = user.account.access_token;
    let budID = user.budget_id;
    let catID = user.category_id;

    const ynabAPI = new ynab.API(accessToken);

    try{
        const singleCategory = await ynabAPI.categories
        .getCategoryById(budID, catID)
        .then(response => {
            category = response.data.category.balance;    
        })
    }
    catch (e) {
            console.log(`error: ${JSON.stringify(e)}`);
    }  
    return category;
}


router.post('/auth', (req, res) => {
    const userId = req.query.state; 
    const code = req.query.code;
    const accountId = {}

    request
        .post('https://app.youneedabudget.com/oauth/token')
        .send({
            client_id: "524cb6ed48eb7037b8391bc45974590dace8e9b2434cc03e5ae595b54412cced",
            client_secret: `${CLIENT_SECRET}`,
            redirect_uri: "https://money-jars.herokuapp.com/authorization",
            grant_type: "authorization_code",
            code: `${code}`
        })
        .then(function(response){
            const data = JSON.parse(response.text);
            const tokenData = {
                access_token: data.access_token,
                expires_in: data.expires_in,
                refresh_token: data.refresh_token,
                created_at: data.created_at,
            };
            return tokenData;
        })
        .then (function(tokenData){
            let newAccount = Account.create(tokenData)               
            return newAccount
        })
        .then(function(newAccount){
            const userAccount = addToUser(newAccount._id, userId)
            return newAccount.access_token
        })
        .then(function(token){
            let budgetList = retrieveBudgets(token)
            return budgetList
        })
        .then(budgets => res.json(budgets))
        .catch(err => res.status(500).json(errorParser.generateErrorResponse(err)))    
})

async function addToUser(accountId, userId){
    const updatedUser = {}

    try{
        User.findByIdAndUpdate(userId, {$set: {account: accountId}} )
        .then((user) => {updatedUser.data = user});
    }
    catch(e){
        console.log(`error: ${JSON.stringify}`)
    }
    return updatedUser.data;
}

async function retrieveBudgets(accessToken){
    const ynabAPI = new ynab.API(accessToken);
    const budgetList = []

    try{
        const budgetsResponse = await ynabAPI.budgets.getBudgets();
        const budgets = budgetsResponse.data.budgets;
        for (let budget of budgets){
            budgetList.push({label: budget.name,
                             value: budget.id})
        }
    } catch (e) {
        console.log(`error: ${JSON.stringify(e)}`);
    }

    return budgetList
}

module.exports = router;
