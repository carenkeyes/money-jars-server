const USER_INFO = {};

const express = require('express');
const router = express.Router();
const request = require('superagent');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const morgan = require('morgan');
const mongoose = require('mongoose');

const {CLIENT_SECRET, REDIRECT_URI} = require('../config');
//Oauth code will come from authorization request
//This is for development only


const ynab = require('ynab');
let accessToken = '15b48ce22e763a8dda4c471d06d7686fecb3e517bbf9d98792ed283df39fdcf7'
const ynabAPI = new ynab.API(accessToken);

mongoose.Promise = global.Promise;

const app = express();

app.use(morgan('common'));
app.use(express.json());

router.get('/', (req, res) => {
    res.json({status: 'working'});
});

router.get('/budgets', (req, res) => {
    let budgetList;
    console.log(USER_INFO)
    console.log(USER_INFO.created_at);
    console.log(USER_INFO.expires_in);
    console.log(Date.now());

    /*if (USER_INFO.created_at + USER_INFO.expires_in < Date.now()){
        console.log(Date.now())
        console.log('token expired');
        refreshToken()
    }*/

    ynabAPI.budgets
        .getBudgets()
        .then(response => {
            budgetList = renderBudgets(response)
        })
        .catch(err => {
            console.log(err)
        })

    console.log(budgetList);
    res.json({status: 'budgets'});

})

function renderBudgets(results){
    console.log(results.data.budgets[0].name);
    console.log(results.data.budgets.length);
    const budgetList = []
    for(let i=0; i<results.data.budgets.length; i++){    
            console.log(results.data.budgets[i].name)
            console.log(results.data.budgets[i].id)
            budgetList.push({
                //name:results.data.budgets[i].name,
                //id:results.data.budgets[i].id
                i
            })
    }
    console.log(`budgetList: ${budgetList}`)
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
        })
        .catch(function(err){
            console.log(err.message)
        })
}

module.exports = router;
