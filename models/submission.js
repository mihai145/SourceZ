const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
    author: String,
    toProblem: String,
    cpp: String,
    created: {type: Date, default: Date.now},
    judged: {type: Boolean, default: false},
    compilerMessage: String,
    results: [String],
    verdict: String,
    score: {type: Number, default: 0}
});

module.exports = mongoose.model("Submission", submissionSchema);
