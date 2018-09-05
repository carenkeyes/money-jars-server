const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const User = require('../src/models/userModel');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL, config} = require('../config');

chai.use(chaiHttp);

function seedUserData(){
    const userData = []
    for(let i=1; i<=3; i++){
        userData.push(generateUserData())
    }
    console.log(`userdata: ${userData[0]}`)
    return User.insertMany(userData);
}

function generateUserData(){
    return{
       username: faker.internet.userName(),
       email: faker.internet.email(),
       password: faker.internet.password()
    }
}

function tearDownDb(){
    return mongoose.connection.dropDatabase();
}

describe('User endpoint', function(){
    this.timeout(10000)

    before(function(){
        return runServer(TEST_DATABASE_URL);
    });
    beforeEach(function(){
        //console.log(seedUserData());
        return seedUserData();
    });
    afterEach(function(){
        return tearDownDb();
    })
    after(function(){
        return closeServer();
    });

    describe('login', function(){
        
        it('should return jwt key at login', function(){
            const testUser = {};

            return User
                .findOne()
                .then(function(foundUser){
                    testUser.username = foundUser.username
                    testUser.password = foundUser.password
                })

                return chai.request(app)
                    .post('/api/user/login')
                    .send(testUser)
                    .then(function(res){
                        expect(res).to.have.status(200);
                        expect(res).to.be.an('object');
                        expect(res).to.include.keys('authToken')        
                    });
        });
    });

    describe('{Protected user data}', function(){
        
        it('should retrieve user id', function(){
        const mockUser = generateUserData();
        return User.create(mockUser)
        const token = jwt.sign({user}, config.JWT_SECRET, {
            subject: mockUser.username,
            expiresIn: config.JWT_EXPIRY,
            alogorithm: 'HS256'
        });

        return chai.request(app)
            .get('/api/user/protected')
            .set('Authorization', `Bearer ${token}`)
            .then(function(res){
                expect(res).to.have.status(304);
                expect(res).to.be.json;
                expect(res.body).to.include.keys('_id', 'username', 'email')
            })

        });
    });
    
    describe('POST endpoint', function(){

        it('should add a new user', function(){
            const newUser = {user: generateUserData()};
            console.log(`newUser: ${newUser}`)

            return chai.request(app)
                .post('/api/user')
                .send(newUser)
                .then(function(res){
                    expect(res).to.have.status(201);
                    expect(res).to.be.json;
                    return User.findById(res.body._id);
                })
                .then(function(foundUser){
                    expect(foundUser.username).to.equal(newUser.user.username);
                });
        });               
    });

    describe('PUT endpoint', function(){
        it('should add a child user to parent profile', function(){
            const childUser = {}
            const parentUser = {}

            return User
                .find()
                .then(function(user){
                    parentUser._id = user[0]._id;
                    childUser.username = user[1].username;
                    childUser._id = user[1]._id;
                return chai.request(app)
                .put(`/api/user/child/${parentUser._id}`)
                .send(childUser)
                })
            .then(function(res){
                expect(res).to.have.status(201);
                return User.findById(parentUser._id)
            })
            .then(function(foundParent){
                let parentId = foundParent.children[0]._id;
                let childId = childUser._id;
                expect(parentId).to.deep.equal(childId)
            })
        });
    
        it('should update user profile', function(){
            const testUser = {}
            const category = {
                data: {
                    category_id: faker.random.word()
                }
            }

            return User
                .findOne()
                .then(function(user){
                    testUser.id = user._id;
                return chai.request(app)
                .put(`/api/user/${testUser.id}`)
                .send(category)
            })
            .then(function(res){
                expect(res).to.have.status(201);
                return User.findById(testUser.id)
            })
            .then(function(foundUser){
                expect(foundUser.category_id).to.equal(category.data.category_id)
            })
        
        });
    });
});