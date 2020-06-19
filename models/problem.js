const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
    name: String,
    author: String, 
    content: String
});

module.exports = mongoose.model("Problem", problemSchema);
