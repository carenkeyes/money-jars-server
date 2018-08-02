const User = require('../models/userModel');
const {CLIENT_SECRET} = require('../../config');
const request = require('superagent');

module.exports = (req, res, next) => {
    console.log('refresh token ran');
    let accessToken;

    User.findById(req.params.id)
    .then((user) => {
        accessToken = user.access_token;
        console.log(`accessToken: ${accessToken}`);
        console.log(`expires in: ${user.expires_in}`)
        if(!accessToken){
            const message = 'You must obtain an access token first';
            return res.status(400).json({
                generalMessage: 'Not authorized',
                messages: [message]
            })
        }
        else if(user.created_at + user.expires_in < Math.floor(Date.now()/1000)){
            console.log('token expired');
            request
            .post('https://app.youneedabudget.com/oauth/token')
            .send({
                client_id: "524cb6ed48eb7037b8391bc45974590dace8e9b2434cc03e5ae595b54412cced",
                client_secret: `${CLIENT_SECRET}`,
                grant_type: 'refresh_token',
                refresh_token: `${user.refresh_token}`
            })
            .then(res => {
                console.log(`response: ${res}`);
                const toUpdate = {
                        access_token: res.access_token,
                        expires_in: res.expires_in,
                        refresh_token: res.refresh_token,
                        created_at: res.created_at,
                }
                User.findByIdAndUpdate(req.params.id, {$set: toUpdate})
                .then(updated => console.log(`updatedToken: ${updated}`))
            })
            .catch(function(err){
                console.log(err.message)
            })
        }
    })
    return next(accessToken);
}