const USER_INFO = {
    access_token:  '862a8e2f2bf1-this-is-fake-4bb0f28066f3065990',
    expires_in: 7200,
    refresh_token:'f3a9e6441b52c2f-also-fake-56dd46073bb5259ab7',
    created_at:  1532638767 
};

const express = require('express');
const router = express.Router();
const request = require('superagent');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const morgan = require('morgan');
const mongoose = require('mongoose');

const {CLIENT_SECRET, REDIRECT_URI} = require('../../config');
//Oauth code will come from authorization request
//This is for development only


const ynab = require('ynab');
let accessToken = USER_INFO.access_token;
const ynabAPI = new ynab.API(accessToken);

mongoose.Promise = global.Promise;

const app = express();

app.use(morgan('common'));
app.use(express.json());

router.get('/', (req, res) => {
    res.json({status: 'working'});
});

router.get('/budgets', (req, res) => {

    console.log(`created: ${USER_INFO.created_at}`)
    console.log(`expires: ${USER_INFO.expires_in}`)
    console.log(`current date: ${Math.floor(Date.now()/1000)}`);

    if (USER_INFO.created_at + USER_INFO.expires_in < Math.floor(Date.now()/1000)){
        console.log('token expired');
        refreshToken()
    } else{
        retrieveBudgets()
            .then(budgets => {res.json({budgets: budgets})}) 
            .catch(err => console.log(err))
    }
})

async function retrieveBudgets(){
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

    return budgetList

}

//For production, add a visit to the authorization page first, then
//get the access token 
//They are two steps currently because of development limitations
router.post('/auth', (req, res) => {
    console.log('redirect worked')
    let code = "95db61b01a1072766f8bf79622aae449a8134963c79b0afbe1368d0538368ea3"   
    getToken(code)
})

function getToken(code){
    request
        .post('https://app.youneedabudget.com/oauth/token')
        .send({
            client_id: "524cb6ed48eb7037b8391bc45974590dace8e9b2434cc03e5ae595b54412cced",
            client_secret: `${CLIENT_SECRET}`,
            redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
            grant_type: "authorization_code",
            code: `${code}`
        })
        .then(res => {
            USER_INFO.access_token = res.body.access_token
            USER_INFO.expires_in = res.body.expires_in
            USER_INFO.refresh_token = res.body.refresh_token
            USER_INFO.created_at = res.body.created_at
            console.log(USER_INFO)
        })
        .catch(function(err){
            console.log(err.message)
        })
    
}

function refreshToken(){
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
        })
}

module.exports = router;
