
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
        .populate('account')
    .then((user) => retrieveBudgets(user.account.access_token))
    .then((budgets) =>res.json(budgets))   
    .catch(err => res.status(400).json(errorParser.generateErrorResponse(err)))
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
    .catch(err => res.status(400).json(errorParser.generateErrorResponse(err)))
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

    //console.log(`category list: ${categoryList}`)
    return categoryList
}

router.get('/category/:id', refreshToken, (req, res) => {
    console.log('req.params.id')
    return User
        .findById(req.params.id)
        .populate('account')
        /*.then(function(user){
            accessToken = user.account.access_token;
            budgetId = user.budget.budget_id,
            categoryId = user.budget.category_id,
            console.log(`accessToken: ${accessToken}`)
        })*/
    .then(function(user){
        return retrieveBalance(user)
    })
    .then(function(balance){
        res.json(balance);
    })   
    .catch(err => res.status(400).json(errorParser.generateErrorResponse(err)))

})

async function retrieveBalance(user){
    console.log('retrieve balance ran')
    let accessToken = user.account.access_token;
    let budID = user.budget_id;
    let catID = user.category_id;

    console.log(`accessToken: ${accessToken}`)
    console.log(`budID: ${budID}`)
    console.log(`catID: ${catID}`)
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
    console.log(category);  
    return category;
}



//For production, add a visit to the authorization page first, then
//get the access token 
//They are two steps currently because of development limitations
router.post('/auth', (req, res) => {
    const userId = req.query.state; 
    const code = req.query.code;
    const accountId = {}

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
            //console.log(tokenData);
            return tokenData;
        })
        .then (function(tokenData){
            let newAccount = Account.create(tokenData)               
            //console.log(`newAccount: ${newAccount}`)
            return newAccount
        })
        .then(function(newAccount){
            const userAccount = addToUser(newAccount._id, userId)
            console.log(`userAccount ${userAccount}`)
            return newAccount.access_token
        })
        .then(function(token){
            console.log(`token: ${token}`)
            let budgetList = retrieveBudgets(token)
            return budgetList
        })
        .then(budgets => res.json(budgets))
        .catch(err => res.status(400).json(errorParser.generateErrorResponse(err)))    
})

async function addToUser(accountId, userId){
    console.log(`210 account_id: ${accountId}`)
    console.log(`211 user_id: ${userId}`)
    const updatedUser = {}

    try{
        User.findByIdAndUpdate(userId, {$set: {account: accountId}} )
        .then((user) => {console.log(`215 user: ${user}`); updatedUser.data = user});
    }
    catch(e){
        console.log(`error: ${JSON.stringify}`)
    }
    return updatedUser.data;
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
            budgetList.push({label: budget.name,
                             value: budget.id})
        }
    } catch (e) {
        console.log(`error: ${JSON.stringify(e)}`);
    }

    console.log(`budget list: ${budgetList[0].label}`)
    return budgetList
}

module.exports = router;
