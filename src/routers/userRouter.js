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
    .post(disableWithToken, requiredFields('user'), (req, res) => {
        User.create({
            email: req.body.user.email,
            password: req.body.user.password,
            username: req.body.user.username,
            usertype: req.body.user.type,
            account: req.body.user.account,
            budget_id: req.body.user.budget_id,
            category_id: req.body.user.category_id,
            balance: req.body.user.balance,
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
        .populate('children', (['username', 'balance', '_id', 'goals']))
        .populate('goals')
        .then(user => res.json({
            user: {
                _id: user._id,
                username: user.username,
                usertype: user.usertype,
                budget_id: user.budget_id,
                //category_id: user.category_id,
                balance: user.balance,
                children: user.children,
                goals: user.goals,
                setupComplete: user.setupComplete,
                account: user.account,
            }
        }));
    })

router.post('/login', disableWithToken, requiredFields('username', 'password'), (req, res) => {
    User.findOne({username: req.body.username})
        .populate('children', (['_id', 'username', 'goals', 'balance']))
        .populate('goals')
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
                    balance: foundUser.balance,
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
        .then(function(child){
            let updatedUser = addChild(child.id, parentId )
            return updatedUser;
        })
        .then(function(user){
            let updatedUser = getUpdatedUser(parentId)
            return updatedUser
        })
        .then(user => res.status(201).json({user}))
        .catch(err => res.status(400).json(errorParser.generateErrorResponse(err)));
        
    });


async function addChild(childId, parentId){
    console.log('add child ran')
    const parent = {};

    try{
        const foundUser = await User.findByIdAndUpdate(parentId, {$addToSet: {children: childId}})
        parent.data = foundUser;
    }
    catch(e){
        console.log(`error: ${JSON.stringify}`)
    }
    console.log(`parent: ${parent.data}`)
    return parent.data;
}



router.delete('/:id', (req, res) => {
    User.findByIdAndRemove(req.params.id)
    .then(() => res.status(204).end())
})

router.put('/:id', (req, res) => {
    let UserId = req.params.id;
    const update = {};
    const updateable = ['category_id', 'budget_id', 'setupComplete']

    updateable.forEach(field => {
        if (field in req.body.data){
            update[field] = req.body.data[field]
        }
    });

    console.log(`update: ${update}`)
    return User.findByIdAndUpdate(req.params.id, {$set: update})
    .then(function(){
        let updatedUser = getUpdatedUser(UserId)
        return updatedUser
    }) 
    .then(updatedUser => res.status(201).json({updatedUser}))
    .catch(err => res.status(400).json(errorParser.generateErrorResponse(err)));
})

router.put('/balance/:id', (req, res) => {
    let UserId = req.params.id;
    let data = req.body.data;

    console.log(data)
    return User.findByIdAndUpdate(req.params.id, {
        $inc: {balance: req.body.data.balance}
    })
    .then(function(){
        let updatedUser = getUpdatedUser(UserId)
        return updatedUser
    }) 
    .then(updatedUser => res.status(201).json({updatedUser}))
    .catch(err => res.status(400).json(errorParser.generateErrorResponse(err)));
})

async function getUpdatedUser(userId){
    const updatedUser = {}
    try{
        const foundUser = await User
            .findById(userId)
            .populate('children', (['username', 'category_balance', '_id', 'goals']))
            .populate('goals')
        updatedUser.data = foundUser;
    }
    catch(err){
        console.log(`error: ${JSON.stringify(err)}`)
    }
    console.log(`updatedUser: ${updatedUser}`)
    return updatedUser.data
}


module.exports = router;



//User.findByIdAndUpdate(req.params.id, {$addToSet: {children: child._id}})