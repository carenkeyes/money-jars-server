const bcrypt = require('bycrpt.js');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
require('mongoose-type-email');
mongoose.Promise = global.Promise;


const userSchema =  new mongoose.Schema({
    username:{type: String, required: true, unique: true},
    email: {type: mongoose.Schema.Types.Email, required: true},
    password: {type: String, required: true},
    oauth_code: {type: String},
    token: {
        access_token: String,
        expires_in: Number,
        refresh_token: String,
        created_at: Number
    }
})

userSchema.pre('save', function userPreSave(next){
    const user = this;
    if(this.isModified('password') || this.isNew) {
        return bcrypt.hash(user.password, 10)
            .then((hash) => {
                user.password = hash;
                return next();
            })
            .catch(err => next(err));
    }
    return next();
})

userSchema.plugin(uniqueValidator);

userSchema.methods.comparePassword = function userComparePassword(password){
    return bcrypt.compare(password, this.password);
}

module.exports = mongoose.model('User', 'UserSchema');
