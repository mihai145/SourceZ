const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    title: String,
    text: String,
    author: String
});

module.exports = mongoose.model("Post", postSchema);
