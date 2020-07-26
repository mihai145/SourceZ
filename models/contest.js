const mongoose = require("mongoose");

const contestSchema = new mongoose.Schema({
    title: String,
    author: String,
    editorial: String,
    problem1: String,
    problem2: String,
    created: {type: Date, default: Date.now},
    startDate: { type: Date, default: Date.now },
    finishDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Contest", contestSchema);
