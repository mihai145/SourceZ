const express = require('express');
const router = express.Router();
const fs = require('fs');

const shell = require('shelljs');

const passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

const authMiddleware = require("../utils/authorizationMiddleware");
const flashMessages = require("../utils/flashMessages");

const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require('../models/user');
const { isLoggedIn } = require('../utils/authorizationMiddleware');
const { runInNewContext } = require('vm');
const { rootCertificates } = require('tls');

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

router.get("/problemset/submissions", (req, res) => {
    Submission.find({}).sort({ created: -1 }).limit(100).then(submissions => {
        res.render("problemset/queue", {submissions: submissions});
    });
});

router.get("/problemset/submissions/:id", authMiddleware.isLoggedIn, authMiddleware.submissionAuth, (req, res) => {
    Submission.findById(req.params.id, (err, submission) => {
        if (err || !submission) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/problemset/submissions");
        } else {
            res.render("problemset/submission", {submission: submission});
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
            if(!req.isAuthenticated()) {
                res.render("problemset/problem", {problem : problem, submissions : null});
            } else {
                Submission.find({ author: req.user.username, toProblem: req.params.problemName }).sort({ created: -1 }).limit(4)
                .then(submissions => {
                    res.render("problemset/problem", { problem: problem, submissions: submissions });
                });
            }
        }
    });
});

router.post("/problemset/:problemName", authMiddleware.isLoggedIn, (req, res) => {
    
    let now = new Date();
    let diffMs = (now - req.user.lastSubmission);

    // console.log("----");
    // console.log(now);
    // console.log(req.user.lastSubmission);
    // console.log("----");

    let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

    console.log(diffMins);

    if(diffMins < 2 && (req.user.lastSubmission !== null)) {
        req.flash("fail", "You submitted a solution less than 2 minutes ago. You can only submit once every two minutes");
        res.redirect("/problemset");
    } else {

        User.findOneAndUpdate({ username: req.user.username }, { lastSubmission: now}, (err, user) => {
            if(err || !user) {
                console.log(err);
                req.flash("fail", "Couldn`t save your submission. Try again...");
                res.redirect("/problemset");
            } else {
                let submission = {};

                submission.author = req.user.username;
                submission.toProblem = req.params.problemName;
                submission.cpp = req.body.clientSource;

                Submission.create(submission, (err, subm) => {
                    if (err || !subm) {
                        console.log(err);
                        req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                        res.redirect("/problemset");
                    } else {

                        // console.log(subm);

                        fs.writeFileSync("CheckerEnv/Checker/current.txt", submission.cpp, "utf8");

                        const commandString = "sh CheckerEnv/Checker/check.sh " + req.params.problemName;
                        //console.log(commandString);
                        req.flash(flashMessages.successfullySubmited.type, flashMessages.successfullySubmited.message);
                        res.redirect("/problemset");

                        shell.exec(commandString);
                    }
                });
            }
        }); 
    }
});

module.exports = router;