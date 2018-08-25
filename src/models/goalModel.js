const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const goalSchema = new mongoose.Schema({
    title: String,
    goal_amount: Number,
    saved_amount: Number,
    goal_image: String,
    withdraw_reqest: Number,
})

module.exports = mongoose.model('Goal', goalSchema); 