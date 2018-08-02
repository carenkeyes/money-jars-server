
const express = require('express');
const router = express.Router();
const request = require('superagent');
const refreshToken = require('../middleware/refreshToken.middleware');
const User = require('../models/userModel');
const errorParser = require('../helpers/errorsParserHelper');

const bodyParser = require('body-parser');

const morgan = require('morgan');
const mongoose = require('mongoose');

const {CLIENT_SECRET, REDIRECT_URI} = require('../../config');
//Oauth code will come from authorization request
//This is for development only


const ynab = require('ynab');
let accessToken = 'e6213ca765d0b60781211e505d30e819b3617dace4c7b77f0ca38406d9f9baad'
const ynabAPI = new ynab.API(accessToken);

mongoose.Promise = global.Promise;

const app = express();

app.use(morgan('common'));
app.use(express.json());

router.get('/', (req, res) => {
    res.json({status: 'working'});
});

// refreshToken,
router.get('/budgets/:id', (req, res) => {

    return User
        .findById(req.params.id)
        /*.then(function(user){
            accessToken = user.access_token;
        })*/
    .then(function(){
        return retrieveBudgets()
    })
    .then(function(budgets){
        res.json(budgets);
    })   
    .catch(err => res.status(400).json(errorParser.generateErrorResponse(err)))
})

async function retrieveBudgets(){
    console.log('retrieve budgets ran');
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
            return tokenData;
        })
        .then (function(updateUser){
            User
                .findByIdAndUpdate(userID, {$set: updateUser})
                .then(updated => res.json(updated));
        })
        .catch(err => res.status(400).json(errorParser.generateErrorResponse(err)))
    
})

router.get('/test/:id', (req, res) => {
    User
        .findById(req.params.id)
        .then(user => res.json({user}))
})

module.exports = router;
