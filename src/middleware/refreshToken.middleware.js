const User = require('../models/userModel');
const Account = require('../models/ynabModel');
const {CLIENT_SECRET} = require('../../config');
const request = require('superagent');

module.exports = (req, res, next) => {
    console.log('refresh token ran');
    const userID = req.params.id;
    const token = {};

    User
        .findById(userID)
        .populate('budget')
        .then(function(user){
            token.id = user.budget._id
            token.access_token = user.budget.access_token
            token.expires_in = user.budget.expires_in
            token.refresh_token = user.budget.refresh_token
            token.created_at = user.budget.created_at
        })
    .then((user) => {
        console.log(`token.id: ${token.id}`)
        if(!token.access_token){
            const message = 'You must obtain an access token first';
            return res.status(400).json({
                generalMessage: 'Not authorized',
                messages: [message]
            })
        }
        else if(token.created_at + token.expires_in < Math.floor(Date.now()/1000)){
            console.log('token expired');
            request
            .post('https://app.youneedabudget.com/oauth/token')
            .send({
                client_id: "524cb6ed48eb7037b8391bc45974590dace8e9b2434cc03e5ae595b54412cced",
                client_secret: `${CLIENT_SECRET}`,
                grant_type: 'refresh_token',
                refresh_token: `${token.refresh_token}`
            })
            .then(function(response){
                const data = JSON.parse(response.text);
                console.log(`data: ${data}`)
                const tokenData = {
                    access_token: data.access_token,
                    expires_in: data.expires_in,
                    refresh_token: data.refresh_token,
                    created_at: data.created_at,
                };
                console.log(tokenData);
                return tokenData;
            })
            .then (function(updateAccount){
                console.log(`new token: ${updateAccount.access_token}`)
                console.log(`token.id: ${token.id}`)
                Account
                    .findByIdAndUpdate(token.id, {$set: updateAccount})
                    .then(account => console.log(`account: ${account}`))
            })
            .catch(function(err){
                console.log(err.message)
            })
        }
    })
    return next();
}