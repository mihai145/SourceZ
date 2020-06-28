const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const User = new mongoose.Schema({
    username: String,
    password: String,
    rating: {type: Number, default: 1000},
    lastSubmission: {type: Date, default: new Date(2000, 01, 01)},
    solvedProblems: [String],
    isAdmin: {type: Boolean, default: false},
    isOwner: {type: Boolean, default: false}
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);