const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: String,
    name: String,
    email: String,
    password: String,
    phone: Number,
    dateOfBirth: Date
    
})

const User = mongoose.model('User', UserSchema);

module.exports = User;