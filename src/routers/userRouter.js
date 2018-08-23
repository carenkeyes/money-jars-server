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
    .post(disableWithToken, requiredFields('username', 'password'), (req, res) => {
        User.create({
            email: req.body.email,
            password: req.body.password,
            username: req.body.username,
            usertype: req.body.type,
        })
        .then(() => res.status(201).send())
        .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)));
    })
    .get(passport.authenticate('jwt', {session: false}), (req, res) => {
        res.status(200).json(req.user);
    });

router.route('/protected/')
    .get(passport.authenticate('jwt', {session: false}), (req, res) => {
       console.log(`requestion: ${req}`) 
        User.findById(req.user)
        //.then(user => console.log(`user: ${user}`))
        //.populate('children', '_id')
        .then(user => res.json({user}));
    })

router.post('/login', disableWithToken, requiredFields('username', 'password'), (req, res) => {
    User.findOne({username: req.body.username})
    .then((foundResult) => {
        if(!foundResult){
            return res.status(400).json({
                generalMessage: 'Username or password is incorrect',
            });
        }
        //console.log(foundResult);
        return foundResult;
    })
    .then((foundUser) => {
        foundUser.comparePassword(req.body.password)
        .then((comparingResult) => {
            if(!comparingResult) {
                return res.status(400).json({
                    generalMessage: 'Username or password is incorrect',
                });
            }
            const tokenPayload = {
                _id: foundUser._id,
                email: foundUser.email,
                username: foundUser.username,
            };
            const token = jwt.sign(tokenPayload, config.SECRET, {

            });
            return res.json({token: `Bearer: ${token}`});
        });
    })
    .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)));
});

router.put('/child/:id', (req, res) => {
    User.findOne({username: req.body.username})
        .then((foundChild) => {
            if(!foundChild){
                return res.status(400).json({
                    generalMessage:'Cannot find child account',
                });
            }
            console.log(foundChild)
            return foundChild;
        })
        .then((child) => {
            User.findByIdAndUpdate(req.params.id, {$addToSet: {children: child}})
        })
        .then(a => res.status(204).end())
        .catch(err => res.status(400).json(errorParser.generateErrorResponse(report)));
        
    });

module.exports = router;