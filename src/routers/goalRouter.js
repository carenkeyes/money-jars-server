const express = require('express');
const morgan = require('morgan');
const Goal = require('../models/goalModel');
const User = require('../models/userModel');
const errorParser = require('../helpers/errorsParserHelper');

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
        .then((goal) => {res.status(201).json({goal})})
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
        Goal.findById(req.params.id)
        .then(goal => res.json(goal))
        .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)))
    })
    .put((req, res) => {
        userId = req.body.userId
        console.log(req.body)
        Goal.findByIdAndUpdate(req.params.id,
            {
                $inc: {saved_amount: req.body.change},
                //$set: {withdraw_request: req.body.request}
            }
        ).then(function(){
            let updatedGoals = getUpdatedGoals(userId)
            return updatedGoals
        })
        .then((goals) => res.status(201).send(goals))
        .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)))
    })
    .delete((req, res) => {
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
    const updatedGoals = []
    try{
        const foundUser = await User.findByIdAndUpdate(userId, {$pull: {goals: goalId}}).populate('goals')
        for(let i=0; i<foundUser.goals.length; i++){
            updatedGoals.push(foundUser.goals[i])
        }
    }
    catch(err){
        console.log(`error: ${JSON.stringify(err)}`)
    }
    return updatedGoals
}

async function getUpdatedGoals(userId){
    const updatedGoals = {}
    try{
        const foundUser = await User.findById(userId).populate('goals')
        updatedGoals.goals = foundUser.goals
    }
    catch(err){
        console.log(`error: ${JSON.stringify(err)}`)
    }
    return updatedGoals
}

//I don't think I'm using this
/*router.route('/request/:id')
    .put((req, res) => {
        Goal.findByIdAndUpdate(req.params.id, {$unset: {withdraw_request: ''}})
        .then(() => res.status(204).end())
    })*/
            

router.route('/edit/:id')
    .put((req, res) => {
        const update = {};
        const updateable = ['title', 'category', 'goal_amount', 'goal_image', 'request']
        updateable.forEach(field => {
            if(field in req.body){
                update[field] = req.body[field]
            }
        });
        console.log(update)
        Goal.findByIdAndUpdate(req.params.id, {$set: update})
        .then((goals) => res.status(201).send(goals))
        .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)))
    })    

module.exports = router;