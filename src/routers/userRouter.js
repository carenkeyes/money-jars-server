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
            account: req.body.account,
            budget_id: req.body.budget_id,
            category_id: req.body.category_id,
        })
        .then((user) => res.status(201).json({
            _id: user._id,
            username: user.username,
            usertype: user.usertype,
        }))
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
        .populate('children', ('username', 'category_balance', '_id', 'goals'))
        .populate('goals')
        .then(user => res.json({
            user: {
                _id: user._id,
                username: user.username,
                usertype: user.usertype,
                budget_id: user.budget_id,
                category_id: user.category_id,
                category_balance: user.category_balance,
                children: user.children,
                goals: user.goals,
                setupComplete: user.setupComplete,
                account: user.account,
            }
        }));
    })

router.post('/login', disableWithToken, requiredFields('username', 'password'), (req, res) => {
    User.findOne({username: req.body.username})
        .populate('children')
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
            return res.json({                
                token: `Bearer: ${token}`,
                userInfo: {
                    _id: foundUser._id,
                    username: foundUser.username,
                    usertype: foundUser.usertype,
                    budget_id: foundUser.budget_id,
                    category__id: foundUser.category_id,
                    category_balance: foundUser.category_balance,
                    children: foundUser.children,
                    account: foundUser.account,
                    setupComplete: foundUser.setupComplete,
                    goals: foundUser.goals                       
                }});
        });
    })
    .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)));
});

router.put('/child/:id', (req, res) => {
    console.log(req.params.id);
    let parentId = req.params.id;
    User.findOne({username: req.body.username})
        .then((foundChild) => {
            if(!foundChild){
                return res.status(400).json({
                    generalMessage:'Cannot find child account',
                });
            }
            return foundChild;
        })
        .then((child) => {
            addChild(child.id, parentId )
        })
        .then(a => res.status(204).end())
        .catch(err => res.status(400).json(errorParser.generateErrorResponse(report)));
        
    });

router.delete('/:id', (req, res) => {
    User.findByIdAndRemove(req.params.id)
    .then(() => res.status(204).end())
})

router.put('/:id', (req, res) => {
    let UserId = req.params.id;
    let data = req.body.data;
    return User.findByIdAndUpdate(req.params.id, {
        $set: {
            category_id: req.body.data.category_id,
            budget_id: req.body.data.budget_id,
            setupComplete: req.body.data.setupComplete,
            }
    })
    .then(User.findById(UserId)
        .populate('children', ('username', 'category_balance', '_id', 'goals'))
        .populate('goals'))        
    .then(updatedUser => res.status(201).json({updatedUser}))
    .catch(err => res.status(400).json(errorParser.generateErrorResponse(report)));
})



async function addChild(childId, parentId){
    console.log('add child ran')
    let parent;

    try{
        User.findByIdAndUpdate(parentId, {$addToSet: {children: childId}})
            .then((user) => parent=user)
    }
    catch(e){
        console.log(`error: ${JSON.stringify}`)
    }
    console.log(`parent: ${parent}`)
    return parent;
}

module.exports = router;

//User.findByIdAndUpdate(req.params.id, {$addToSet: {children: child._id}})