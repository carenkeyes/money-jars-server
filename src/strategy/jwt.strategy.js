const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/userModel');
const config = require('../../config');

module.exports = (passport) => {
    const options = {};
    options.jwtFromRequest = ExtractJwt.fromAuthHeader();
    options.secretOrKey = config.SECRET;
    console.log('something', options.jwtFromRequest);
    passport.use(new JwtStrategy(options, (jwtPayload, done) => {
        console.log(jwtPayload)
        User.findById(jwtPayload._id)
            .then((user) => {
                if (user){
                const userData = {
                    _id: user._id,
                    email: user.email,
                    username: user.username,
                    };
                    done(null, userData);
                } else{
                    done(null, false);
                }
            })
            .catch(error => done(error, false));
    }));
};
