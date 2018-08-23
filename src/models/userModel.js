const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
require('mongoose-type-email');
mongoose.Promise = global.Promise;


const userSchema =  new mongoose.Schema({
    username:{type: String, required: true, unique: true},
    email: {type: mongoose.Schema.Types.Email},
    password: {type: String, required: true},
    usertype: String,
    budget_id: String,
    category_id: String,
    budget_amount: Number,
    children: [{type: mongoose.Schema.Types.ObjectId, ref: 'user'}],
    access_token: String,
    expires_in: Number,
    refresh_token: String,
    created_at: Number
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

module.exports = mongoose.model('User', userSchema);
