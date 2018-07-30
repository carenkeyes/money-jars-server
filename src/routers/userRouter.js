const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

//const config = require('../../config');
const {User} = require('../models/userModel');

mongoose.Promise = global.Promise;

const router = express.Router();

const app = express();

app.use(morgan('common'));
app.use(express.json);

router.get('/test', (req, res) =>{
    res.json({status: 'something worked'})
})

router.get('/', (req, res) => {
    User.find()
    .then(activities => {res.json(activities.map(a => a.serialize()));})
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Not the message I was looking for'});
    });
});

router.post('/', (req, res) => {
    console.log(req.body);
    User.create({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    })
    .then(res.status(201))
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Not the message I was looking for'});
    });
});

module.exports = router;