const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const accountSchema = new mongoose.Schema({
    budget_id: String,
    access_token: String,
    expires_in: Number,
    refresh_token: String,
    created_at: Number
})

module.exports = mongoose.model('Account', accountSchema);