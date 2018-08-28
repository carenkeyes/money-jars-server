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
                    console.log(`foundUser: ${foundUser}`)
                    testUser.username = foundUser.username
                    testUser.password = foundUser.password
                })

                return chai.request(app)
                    .post('/auth/login')
                    .send(testUser)
                    .then(function(res){
                        expect(res).to.have.status(200);
                        expect(res).to.be.an('object');
                        expect(res).to.include.keys('authToken')        
                    });
        });
    });

    describe('User authentication', function(){
        
        it('should retrieve user id', function(){
        const mockUser = generateUserData();
        return User.create(mockUser)
        const token = jwt.sign({user}, config.JWT_SECRET, {
            subject: mockUser.username,
            expiresIn: config.JWT_EXPIRY,
            alogorithm: 'HS256'
        });

        return chai.request(app)
            .get('/user/userdata')
            .set('Authorization', `Bearer ${token}`)
            .then(function(res){
                expect(res).to.have.status(304);
                expect(res).to.be.json;
                expect(res.body).to.include.keys('id', 'username', 'email')
            })

        });
    }); 

});