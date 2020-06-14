const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    title: String,
    text: String,
    author: String,
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],
    codepreciations: { type: Number, default: 0 },
    codepreciatedBy: [String]
});

module.exports = mongoose.model("Post", postSchema);
