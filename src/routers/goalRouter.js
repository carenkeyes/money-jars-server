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
    .post(requiredFields('title', 'goal_amount', 'category'), (req, res) => {
        let userId = req.body.userId;
        Goal.create({
            title: req.body.title,
            category: req.body.category,
            goal_amount: req.body.goal_amount,
            saved_amount: 0,
            goal_image: req.body.goal_image,
        })
        .then(newGoal => addToUser(newGoal._id, userId))
        .then(() => res.status(201).send())
        .catch(report => res.status(400).json(errorParser.generateErrorResponse(report)))
    })
    .get((req, res) => {
        Goal.find()
        .then(goals => res.json(goals));
    })

    async function addToUser(goalId, userId){
        console.log(`goal: ${goalId}, user: ${userId}`)
        try{
            User.findByIdAndUpdate(userId, {$addToSet: {goals: goalId}})
            .then(user => console.log(user));
        }
        catch(e){
            console.log(`error: ${JSON.stringify}`)
        }
        return 
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