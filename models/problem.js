const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
    name: String,
    statement: String,
    inFormat: String,
    outFormat: String,
    restrictions: String,
    inEx: String,
    outEx: String
});

module.exports = mongoose.model("Problem", problemSchema);
