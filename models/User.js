const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const URL = require('./../views/')
const UserSchema = new Schema({
    username: String,
    name: String,
    email: String,
    password: String,
    phone: Number,
    verified: Boolean

})

const User = mongoose.model('User', UserSchema);

module.exports = User;