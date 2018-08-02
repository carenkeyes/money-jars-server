
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
//let accessToken;
//const ynabAPI = new ynab.API(accessToken);

mongoose.Promise = global.Promise;

const app = express();

app.use(morgan('common'));
app.use(express.json());

router.get('/', (req, res) => {
    res.json({status: 'working'});
});


router.get('/budgets/:id', refreshToken, (req, res) => {

        //console.log(refreshToken);    
        /*User.findById(req.params.id)
        .then(res =>{console.log(res.access_token)})
        .then(res =>{let accessToken = 'blueberry'}, console.log(accessToken))
        .then (retrieveBudgets(accessToken)
            .then(budgets => {res.json({budgets: budgets})}) 
            .catch(err => console.log(err)))*/
        res.json({refreshToken});
})

async function retrieveBudgets(){
    const budgetList = []
    const ynabAPI = new ynab.API(accessToken);

    try{
        const budgetsResponse = await ynabAPI.budgets.getBudgets();
        const budgets = budgetsResponse.data.budgets;
        for (let budget of budgets){
            budgetList.push(`[name: ${budget.name}, [id: ${budget.id}]`)
        }
    } catch (e) {
        console.log(`error: ${JSON.stringify(e)}`);
    }

    return budgetList

}

//For production, add a visit to the authorization page first, then
//get the access token 
//They are two steps currently because of development limitations
router.post('/auth', (req, res) => {
    const userID = req.query.id; 
    const code = req.query.code;
    //console.log(userID);
    //console.log(code);
    /*getToken(code)
        .then(response => {
            console.log(`response: ${response.access_token}`);
            User.findByIdAndUpdate(userID, {$set: response})
            .then(res.status(204).end)
        })
        .catch(err => console.log(err))
    res.status(400).end;*/

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

async function getToken(code){
    console.log('get token ran');
    const tokenData = {};
    try{
        const response = await request
            .post('https://app.youneedabudget.com/oauth/token')
            .send({
                client_id: "524cb6ed48eb7037b8391bc45974590dace8e9b2434cc03e5ae595b54412cced",
                client_secret: `${CLIENT_SECRET}`,
                redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
                grant_type: "authorization_code",
                code: `${code}`
            })
            const data = (JSON.parse(response.text));
                //console.log(data.expires_in);
                    tokenData.access_token = data.access_token
                    tokenData.expires_in = data.expires_in
                    tokenData.refresh_token = data.refresh_token
                    tokenData.created_at = data.created_at
          
        }
        catch(err){
            console.log(err.message)
        }

     return tokenData;
}

router.post('/test/:id', (req, res) => {
    User
        .findByIdAndUpdate(req.params.id, {$set: {access_token: 'flibbertigibbet'}})
        .then(user => res.json({user}))
        .catch(err => res.status(500).json({message: err}))
})

router.get('/test/:id', (req, res) => {
    User
        .findById(req.params.id)
        .then(user => res.json({user}))
})



/*function refreshToken(){
    console.log('refresh token ran')
    request
        .post('https://app.youneedabudget.com/oauth/token')
        .send({
            client_id: "524cb6ed48eb7037b8391bc45974590dace8e9b2434cc03e5ae595b54412cced",
            client_secret: `${CLIENT_SECRET}`,
            grant_type: 'refresh_token',
            refresh_token: `${USER_INFO.refresh_token}`
        })
        .then(res => {
            USER_INFO.access_token = res.body.access_token
            USER_INFO.expires_in = res.body.expires_in
            USER_INFO.refresh_token = res.body.refresh_token
            USER_INFO.created_at = res.body.created_at
            console.log(USER_INFO)
            retrieveBudgets();
        })
        .catch(function(err){
            console.log(err.message)
   */

module.exports = router;
