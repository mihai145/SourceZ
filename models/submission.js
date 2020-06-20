const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
    author: String,
    toProblem: String,
    cpp: String,
    created: {type: Date, default: Date.now},
    judged: {type: Boolean, default: false},
    results: [String],
    verdict: String
});

module.exports = mongoose.model("Submission", submissionSchema);
