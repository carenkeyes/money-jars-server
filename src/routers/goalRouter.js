const express = require('express');
const morgan = require('morgan');
const Goal = require('../models/goalModel');
const User = require('../models/userModel');
const errorParser = require('../helpers/errorsParserHelper');
const requiredFields = require('../middleware/requiredFields.middleware');

const router = express.Router();

const app = express();

app.use(morgan('common'));

router.route('/')
    .post((req, res) => {
        let userId = req.body.userId
        Goal.create({
            title: req.body.goal.title,
            category: req.body.goal.category,
            goal_amount: req.body.goal.amount,
            saved_amount: 0,
            goal_image: req.body.goal.imageurl,
        })
        .then(function(newGoal){
           let goal = addToUser(newGoal._id, userId)
           return goal;
        })
        .then((goal) => {console.log(`goal: ${goal}`); res.status(201).json({goal})})
        .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)))
    })
    .get((req, res) => {
        Goal.find()
        .then(goals => res.json(goals));
    })

async function addToUser(goalId, userId){
    const updatedUser = {}
    try{ 
        const foundUser = await User.findByIdAndUpdate(userId, {$addToSet: {goals: goalId}}).populate('goals')
        updatedUser.data = foundUser;
        updatedUser.newGoal = Goal.findById(goalId)
    }
    catch(err){
        console.log(`error: ${JSON.stringify(err)}`)
    }
        return updatedUser.newGoal;
    }

router.route('/:id')
    .get((req, res) => {
        console.log(`userId: ${req.query.userid}`)
        Goal.findById(req.params.id)
        .then(goal => res.json(goal))
        .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)))
    })
    .put((req, res) => {
        userId = req.body.userId
        Goal.findByIdAndUpdate(req.params.id,
            {
                $inc: {saved_amount: req.body.change},
                $set: {withdraw_request: req.body.request}
            }
        ).then(function(){
            let updatedGoals = getUpdatedGoals(userId)
            return updatedGoals
        })
        .then((goals) => res.status(201).send(goals))
        .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)))
    })
    .delete((req, res) => {
        console.log(`goalId: ${req.params.id}`)
        console.log(`userId: ${req.query.userid}`)
        let userId = req.query.userid;
        let goalId = req.params.id
        Goal.findByIdAndRemove(goalId)
        .then(function(){
            let updatedGoals = removeGoalFromUser(userId, goalId)
            return updatedGoals
        })
        .then((data) => {console.log(`data: ${data}`); res.status(201).json({data})});
    });

async function removeGoalFromUser(userId, goalId){
    console.log('remove goal')
    const updatedGoals = []
    try{
        const foundUser = await User.findByIdAndUpdate(userId, {$pull: {goals: goalId}}).populate('goals')
        for(let i=0; i<foundUser.goals.length; i++){
            updatedGoals.push(foundUser.goals[i])
        }
        console.log(updatedGoals)
    }
    catch(err){
        console.log(`error: ${JSON.stringify(err)}`)
    }
    return updatedGoals
}

async function getUpdatedGoals(userId){
    console.log('updated goals')
    const updatedGoals = {}
    try{
        const foundUser = await User.findById(userId).populate('goals')
        console.log(`foundUser: ${foundUser}`)
        console.log(`found user goals: ${foundUser.goals}`)
        updatedGoals.goals = foundUser.goals
        console.log(`updatedGoals: ${updatedGoals}`)
    }
    catch(err){
        console.log(`error: ${JSON.stringify(err)}`)
    }
    return updatedGoals.goals
}

router.route('/request/:id')
    .put((req, res) => {
        Goal.findByIdAndUpdate(req.params.id, {$unset: {withdraw_request: ''}})
        .then(() => res.status(204).end())
    })
            

module.exports = router;