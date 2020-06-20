const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
    author: String,
    toProblem: String,
    submitted: {type: Date, default: Date.now},
    judged: {type: Boolean, default: false},
    results: [String]
});

module.exports = mongoose.model("Submission", submissionSchema);
