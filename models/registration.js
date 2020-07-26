const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({
    contestant: String,
    contest: String,
    p1_score: Number,
    p2_score: Number,
    total_score: Number
});

module.exports = mongoose.model("Registration", registrationSchema);
