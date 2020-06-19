const express = require('express');
const router = express.Router();
const fs = require('fs');

const shell = require('shelljs');

const passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

const problems = [
    {
        name: "adunare",
        statement: "Simple problem! Just read two numbers and output their sum!",
        author: "carage66"
    },

    {
        name: "scadere",
        statement: "Simple problem! Just read a number and!",
        author: "Generalul Miclaus"
    },

    {
        name: "scm",
        statement: "Maximum length increasing Subsequence! Read N, and then the N numbers in the array. Then, output the maximul length of an increasing Subsequence",
        author: "brilas"
    }
]

router.get("/problemset", (req, res) => {
    res.render("problemset/index", {problems: problems});
});

router.post("/scm", (req, res) => {
    fs.writeFileSync("CheckerEnv/Checker/current.txt", req.body.clientSource, "utf8");
    res.send(req.body.clientSource);
    shell.exec("sh CheckerEnv/Checker/check.sh adunare");
});

module.exports = router;