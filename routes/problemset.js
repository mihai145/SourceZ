const express = require('express');
const router = express.Router();
const fs = require('fs');

const shell = require('shelljs');

const passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

const authMiddleware = require("../utils/authorizationMiddleware");
const flashMessages = require("../utils/flashMessages");

const Problem = require("../models/problem");

router.get("/problemset", (req, res) => {
    Problem.find({}, (err, problems) => {
        if(err || !problems) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/problemset");
        } else {
            res.render("problemset/index", { problems: problems });
        }
    });
});

router.get("/problemset/newPb", authMiddleware.isOwner, (req, res) => {
    res.render("problemset/addProblem");
});

router.post("/problemset/newPb", authMiddleware.isOwner, (req, res) => {
    const prob = req.body.problem;

    Problem.create(prob, (err, problem) => {
        if(err || !problem) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/problemset");
        } else {
            req.flash(flashMessages.defaultSuccess.type, flashMessages.defaultSuccess.message);
            res.redirect("/problemset");
        }
    });
});

router.get("/problemset/:problemName", (req, res) => {
    Problem.findOne({name: req.params.problemName}, (err, problem) => {
        if(err || !problem) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/problemset");
        } else {
            res.render("problemset/problem", {problem : problem});
        }
    });
});

router.post("/problemset/:problemName", authMiddleware.isLoggedIn, (req, res) => {
    fs.writeFileSync("CheckerEnv/Checker/current.txt", req.body.clientSource, "utf8");

    const commandString = "sh CheckerEnv/Checker/check.sh " + req.params.problemName;
    //console.log(commandString);
    res.redirect("/problemset");

    shell.exec(commandString);
});

module.exports = router;