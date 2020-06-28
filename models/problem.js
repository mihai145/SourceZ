const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
    name: String,
    author: String, 
    content: String,
    timeLimit: String,
    memoryLimit: String, 
    solvedBy: {type: Number, default: 0}
});

module.exports = mongoose.model("Problem", problemSchema);
