const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

//const config = require('../../config');
const { User } = require('../models/userModel');

mongoose.Promise = global.Promise;

const router = express.Router();

app.use(morgan('common'));
app.use(express.json);

router.get('/', (req, res) => {
    User.find()
    .then(users => res.json(users.map(user => user.serialize())))
    .catch(err => {
        console.err(err);
        res.status(500).json({error: 'Not the message I was looking for'});
    });
});

router.post('/', (req, res) => {
    User.create({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    })
    .then(event => res.status(201).json(event.serialize()))
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'internal server error'});
    });
});
