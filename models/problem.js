const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
    name: String,
    author: String, 
    lang: {type: String, default: "EN"},
    content: String,
    timeLimit: String,
    memoryLimit: String, 
    acceptedSubmissions: {type: Number, default: 0},
    totalSubmissions: {type: Number, default: 0}
});

module.exports = mongoose.model("Problem", problemSchema);
