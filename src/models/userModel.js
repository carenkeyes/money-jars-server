const bcrypt = require('bycrpt.js');
const mongoose = require('mongoose');
require('mongoose-type-email');
mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username:{type: String, required: true, unique: true},
    email: {type: Schema.Types.Email, required: true},
    password: {type: String, required: true},
    oauth_code: {type: String},
    token: {
        access_token: String,
        expires_in: Number,
        refresh_token: String,
        created_at: Number
    },
    kids: [{
        username: {type: String, required: true},
        password: {type: String, require: true}
    }]
})

userSchema.methods.serialize = function(){
    return{
        id: this._id,
        username: this.username,
        email: this.email,
        access_token: this.token.access_token,
        expires_in: this.token.expires_in,
        refresh_token: this.token.expires_in,
        created_at: this.token.created_at
    };
};

/*userSchema.methods.validatePassword = function(password){
    return bycrpt.compare(password, this.password)
}

userSchema.statics.hashPassword = function(password){
    return bcrypt.hash(password, 10);
}*/

const User = mongoose.model('user', userSchema);
module.exports - {User};