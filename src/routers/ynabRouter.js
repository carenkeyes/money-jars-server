
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

const {CLIENT_SECRET, REDIRECT_URI} = require('../../config');
//Oauth code will come from authorization request
//This is for development only


const ynab = require('ynab');
let accessToken;
//const ynabAPI = new ynab.API(accessToken);

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
        .populate('budget')
    .then((user) => retrieveBudgets(user.budget.access_token))
    //.then((accessToken) => retrieveBudgets(accessToken))
    .then((budgets) =>res.json(budgets))   
    .catch(err => res.status(400).json(errorParser.generateErrorResponse(err)))
});

async function getBudgetInfo(budget){
    console.log(`budget: ${budget}`)
    const foundAccount = {}
    try {
        Account.findById(budget)
        .then((account) => foundAccount.token = account)
    }
    catch(e){
        console.log(`error: ${JSON.stringify}`)
    }
    console.log(`accessToken: ${foundAccount.token}`)
    return foundAccount
}

async function retrieveBudgets(accessToken){
    console.log('retrieve budgets ran');
    console.log(`accessToken: ${accessToken}`)
    const ynabAPI = new ynab.API(accessToken);
    const budgetList = []

    try{
        const budgetsResponse = await ynabAPI.budgets.getBudgets();
        const budgets = budgetsResponse.data.budgets;
        for (let budget of budgets){
            budgetList.push(`[name: ${budget.name}, [id: ${budget.id}]`)
        }
    } catch (e) {
        console.log(`error: ${JSON.stringify(e)}`);
    }

    console.log(`budget list: ${budgetList}`)
    return budgetList
}

router.get('/categories/:id',  (req, res) => {
    budgetID = req.query.budgetid;

    return Account
        .findById(req.params.id)
        .then(function(account){
            accessToken = account.access_token;
        })
    .then(function(){
        return retrieveCategories(budgetID)
    })
    .then(function(categories){
        res.json(categories);
    })   
    .catch(err => res.status(400).json(errorParser.generateErrorResponse(err)))
})

async function retrieveCategories(budgetID){
    console.log(`budgetID: ${budgetID}`)
    console.log(`accessToken: ${accessToken}`)
    const ynabAPI = new ynab.API(accessToken);
    const categoryList = []

    try{
        const categoryResponse = await ynabAPI.categories.getCategories(budgetID)
        console.log(`category response: ${categoryResponse}`);
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

    console.log(`category list: ${categoryList}`)
    return categoryList
}

router.get('/category/:id', refreshToken, (req, res) => {
    const categoryID = req.query.categoryid;
    const budgetID = req.query.budgetid;

    return Account
        .findById(req.params.id)
        .then(function(account){
            accessToken = account.access_token;
        })
    .then(function(){
        return retrieveBalance(budgetID, categoryID)
    })
    .then(function(balance){
        res.json(balance);
    })   
    .catch(err => res.status(400).json(errorParser.generateErrorResponse(err)))

})

async function retrieveBalance(budID, catID){
    let category;
    const ynabAPI = new ynab.API(accessToken);

    try{
        const singleCategory = await ynabAPI.categories
        .getCategoryById(budID, catID)
        .then(response => {
            category = response.data.category;    
        })
    }
    catch (e) {
            console.log(`error: ${JSON.stringify(e)}`);
    }  
    console.log(category);  
    return category;
}



//For production, add a visit to the authorization page first, then
//get the access token 
//They are two steps currently because of development limitations
router.post('/auth', (req, res) => {
    const userID = req.query.id; 
    const code = req.query.code;

    request
        .post('https://app.youneedabudget.com/oauth/token')
        .send({
            client_id: "524cb6ed48eb7037b8391bc45974590dace8e9b2434cc03e5ae595b54412cced",
            client_secret: `${CLIENT_SECRET}`,
            redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
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
            console.log(tokenData);
            return tokenData;
        })
        .then (function(tokenData){
            Account.create(tokenData)               
                .then(account => addToUser(account._id, userID));
        })
        .then(updated => res.json(updated))
        .catch(err => res.status(400).json(errorParser.generateErrorResponse(err)))    
})

async function addToUser(accountId, userId){
    let updatedUser;

    try{
        User.findByIdAndUpdate(userId, {$set: {budget: accountId}} )
        .then((user) => updatedUser = user);
    }
    catch(e){
        console.log(`error: ${JSON.stringify}`)
    }
    return updatedUser;
}

router.get('/test/:id', (req, res) => {
    User
        .findById(req.params.id)
        .populate('budget')
        .populate('children')
        .populate('goals')
        .then(user => res.json({user}))
})

module.exports = router;
