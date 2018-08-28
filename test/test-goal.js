const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const Goal = require('../src/models/goalModel');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedGoalData(){
    const goalData = []
    for(let i=1; i<=10; i++){
        goalData.push(generateGoalData())
    }
    return Goal.insertMany(goalData);
}

function generateGoalData(){
    return{
       title: faker.lorem.word(),
       category: faker.lorem.word(),
       goal_amount: faker.finance.amount(),
       goal_image: faker.image.imageUrl(),
       saved_amount: 0,
    }
}

function tearDownDB(){
    return mongoose.connection.dropDatabase();
}

describe('Goal endpoint', function(){
    
    before(function(){
        return runServer(TEST_DATABASE_URL);
    });
    this.beforeEach(function(){
        return seedGoalData();
    });
    afterEach(function(){
        return tearDownDB();
    })
    after(function(){
        return closeServer();
    });

    describe('Get endpoint', function(){
        it('should return all goals', function(){
            let res
            return chai.request(app)
                .get('/api/goal')
                .then(function(response){
                    res = response;
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('array');
                    expect(res.body).to.have.length.of.at.least(1);
                    return Goal.count()
                    .then(function(count){
                        expect(res.body).to.have.lengthOf(count);
                    });
                });
        });

        it('should return the correct goal when called by id', function(){
            let singleGoal
            return chai.request(app)
                .get('/api/goal')
                .then(function(res){
                    res.body.forEach(function(goal){
                        expect(goal).to.be.an('object');
                        expect(goal).to.include.keys('title', 'category', 'goal_amount')
                    });
                    singleGoal = res.body[0];
                    return Goal.findById(singleGoal._id)
                })
                .then(function(goal){
                    console.log(goal.id)
                    expect(singleGoal.title).to.equal(goal.title);
                    expect(singleGoal.goal_amount).to.equal(goal.goal_amount);
                    expect(singleGoal.category).to.equal(goal.category);
                })
        })
    })

    describe('POST endpoint', function(){

        it('should add a new goal', function(){
            const newGoal = generateGoalData();

            return chai.request(app)
                .post('/api/goal')
                .send(newGoal)
                .then(function(res){
                    console.log(`new goal response: ${res}`)
                    expect(res).to.have.status(201);
                })
        })
    })

    describe('PUT endpoint', function(){
        it('should update amount saved and withdrawal request', function(){
            const updateGoal = {
                change: 2,
                request: 5
            }
            const originalGoal = {}

            return Goal
                .findOne()
                .then(function(goal){
                    updateGoal._id = goal._id;
                    originalGoal.saved_amount = goal.saved_amount;
                return chai.request(app)
                    .put(`/api/goal/${updateGoal._id}`)
                    .send(updateGoal)
            })
            .then(function(res){
                expect(res).to.have.status(204);
                return Goal.findById(updateGoal._id);
            })    
            .then(function(foundGoal){
                expect(foundGoal.saved_amount).to.equal(originalGoal.saved_amount+updateGoal.change)
                expect(foundGoal.withdraw_request).to.equal(updateGoal.request)
            })
        });

    });

    describe('DELETE endpoint', function(){
        it('should delete the goal by id', function(){
            const deleteGoal = {}

            return Goal
                .findOne()
                .then(function(goal){
                    deleteGoal._id = goal._id;
                })
                return chai.request(app)
                    .delete(`api/goal/${deleteGoal._id}`)
                    .then(function(res) {
                        expect(res).to.have.status(204);
                        return Event.findById(deleteGoal._id)
                    })
                .then(function(deletedGoal){
                    expect(deletedGoal).to.be.null;
                })
        })
    })
})