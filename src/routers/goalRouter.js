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
           console.log(`goal: ${goal}`)
           return goal;
        })
        .then((goal) => {console.log(goal); res.status(201).json({goal})})
        .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)))
    })
    .get((req, res) => {
        Goal.find()
        .then(goals => res.json(goals));
    })

function addToUser(goalId, userId){
    console.log(`userId: ${userId}`)
    console.log('new user ran')
        User.findByIdAndUpdate(userId, {$addToSet: {goals: goalId}})
        let foundUser = User.findById(userId)
        console.log(`foundUser: ${foundUser}`)
        let newGoal = Goal.findById(goalId)
    console.log(`newGoal: ${newGoal}`)
        return foundUser
    }

    router.route('/:id')
        .get((req, res) => {
            Goal.findById(req.params.id)
            .then(goal => res.json(goal))
            .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)))
        })
        .put((req, res) => {
            Goal.findByIdAndUpdate(req.params.id,
                {
                    $inc: {saved_amount: req.body.change},
                    $set: {withdraw_request: req.body.request}
                }
            ).then(() => res.status(204).send())
            .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)))
        })
        .delete((req, res) => {
            Goal.findByIdAndRemove(req.params.id)
            .then(() => res.status(204).end());
        });

        router.route('/request/:id')
            .put((req, res) => {
                Goal.findByIdAndUpdate(req.params.id, {$unset: {withdraw_request: ''}})
                .then(() => res.status(204).end())
            })
            

module.exports = router;