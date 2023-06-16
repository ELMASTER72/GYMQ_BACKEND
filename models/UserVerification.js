const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserVericationSchema = new Schema({
    userId: String,
    uniqueString: String,
    createAt: Date,
    expireAt: Date,
});

const UserVerication= mongoose.model('UserVerication', UserVericationSchema);

module.exports = UserVerication;