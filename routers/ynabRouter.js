const express = require('express');
const router = express.Router();
const request = require('superagent');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const morgan = require('morgan');
const mongoose = require('mongoose');

const {CLIENT_SECRET, REDIRECT_URI, OAUTH_CODE} = require('../config');
//Oauth code will come from database storage once the database is set up


const ynab = require('ynab');
let accessToken;
const ynabAPI = new ynab.API(accessToken);

mongoose.Promise = global.Promise;

const app = express();

app.use(morgan('common'));
app.use(express.json());

router.get('/', (req, res) => {
    res.json({status: 'working'});
});

router.get('/budgets', (req, res) => {
    
    /*let getToken = function(){
        request
            .post('https://app.youneedabudget.com/oauth/token')
            .send({

            })
    }*/

})

router.post('/auth', (req, res) => {
    console.log('redirect worked')

    getToken(req.params.code)
})

function getToken(response){
    console.log('get token ran');
}

module.exports = router;
