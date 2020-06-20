const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const User = new mongoose.Schema({
    username: String,
    password: String,
    rating: {type: Number, default: 1000},
    lastSubmission: {type: Date, default: Date.now},
    isAdmin: {type: Boolean, default: false},
    isOwner: {type: Boolean, default: false}
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);