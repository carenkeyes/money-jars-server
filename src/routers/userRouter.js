const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const morgan = require('morgan');
const config = require('../../config');
const User = require('../models/userModel');
const errorParser = require('../helpers/errorsParserHelper');
const disableWithToken = require('../middleware/disableWithToken.middleware');
const requiredFields = require('../middleware/requiredFields.middleware');

require('../strategy/jwt.strategy')(passport);

const router = express.Router();

const app = express();

app.use(morgan('common'));

router.route('/')
    .post( requiredFields('email', 'username', 'password'), (req, res) => {
        User.create({
            email: req.body.email,
            password: req.body.password,
            username: req.body.username,
        })
        .then(() => res.status(201).send())
        .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)));
    })
    .get(passport.authenticate('jwt', {session: false}), (req, res) => {
        res.status(200).json(req.user);
    });

router.route('/:id')
    .get(passport.authenticate('jwt', {session: false}), (req, res) => {
        User.findById(req.params.id)
        .then(user => res.json({user}));
    });

router.post('/login', requiredFields('email', 'password'), (req, res) => {
    User.findOne({email: req.body.email})
    .then((foundResult) => {
        if(!foundResult){
            return res.status(400).json({
                generalMessage: 'Email or password is incorrect',
            });
        }
        return foundResult;
    })
    .then((foundUser) => {
        foundUser.comparePassword(req.body.password)
        .then((comparingResult) => {
            if(!comparingResult) {
                return res.status(400).json({
                    generalMessage: 'Email or password is incorrect',
                });
            }
            const tokenPayload = {
                _id: foundUser._id,
                email: foundUser.email,
                username: foundUser.username,
            };
            const token = jwt.sign(tokenPayload, config.SECRET, {
                expiresIn: config.EXPIRATION,
            });
            return res.json({token: `Bearer: ${token}`});
        });
    })
    .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)));
});

    module.exports = {router};