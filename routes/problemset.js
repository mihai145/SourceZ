const express = require('express');
const router = express.Router();

// const fs = require('fs');
// const readline = require('readline');
// const shell = require('shelljs');

const passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

const authMiddleware = require("../utils/authorizationMiddleware");
const flashMessages = require("../utils/flashMessages");

const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require('../models/user');

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

router.get("/problemset/submissions", authMiddleware.isLoggedIn, (req, res) => {
    Submission.find({}).sort({ created: -1 }).limit(20).then(submissions => {
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

router.get("/problemset/:problemName/edit", authMiddleware.isLoggedIn, authMiddleware.isOwner, (req, res) => {
    Problem.findOne({ name: req.params.problemName }, (err, problem) => {
        if (err || !problem) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/problemset");
        } else {
            res.render("problemset/editProblem", {problem: problem});
        }
    });
});

router.put("/problemset/:problemId", authMiddleware.isLoggedIn, authMiddleware.isOwner, (req, res) => {
    let author = req.body.author;
    let content = req.body.content;
    let timeLimit = req.body.timeLimit;
    let memoryLimit = req.body.memoryLimit;
    
    Problem.findByIdAndUpdate(req.params.problemId, { author: author, content: content, timeLimit: timeLimit, memoryLimit: memoryLimit}, (err, problem) => {
        if (err || !problem) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/problemset");
        } else {
            req.flash(flashMessages.defaultSuccess.type, flashMessages.defaultSuccess.message);
            res.redirect("/problemset");
        }
    });
});


router.post("/problemset/:problemName", authMiddleware.isLoggedIn, (req, res) => {
    
    let now = new Date();
    let diffMs = (now - req.user.lastSubmission);

    let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

    ///final version, modify back to two mins!
    if(diffMins < 1 && (req.user.lastSubmission !== null)) {
        req.flash("fail", "You submitted a solution less than 2 minutes ago. You can only submit once every two minutes");
        res.redirect("/problemset/" + req.params.problemName);
    } else {

        ///BASIC CPP SANITIZATION
        if(req.body.clientSource.indexOf("remove") !== -1) {
            req.flash("fail", "Remove is a reserved keyword and it cannot be used in source code");
            return res.redirect("/problemset/" + req.params.problemName);
        } else if(req.body.clientSource.indexOf("system") !== -1) {
            req.flash("fail", "System is a reserved keyword and it cannot be used in source code");
            return res.redirect("/problemset/" + req.params.problemName);
        } else if(req.body.clientSource.indexOf("\"" + req.params.problemName + ".in\"") == -1) {
            req.flash("fail", "Input file named " + req.params.problemName + ".in " + " not detected. Try again...");
            return res.redirect("/problemset/" + req.params.problemName);
        } else if (req.body.clientSource.indexOf("\"" + req.params.problemName + ".out\"") == -1) {
            req.flash("fail", "Output file named " + req.params.problemName + ".out " + " not detected. Try again...");
            return res.redirect("/problemset/" + req.params.problemName);
        }

        User.findOneAndUpdate({ username: req.user.username }, { lastSubmission: now}, (err, user) => {
            if(err || !user) {
                console.log(err);
                req.flash("fail", "Couldn`t save your submission. Try again...");
                res.redirect("/problemset/" + req.params.problemName);
            } else {
                let submission = {};

                submission.author = req.user.username;
                submission.toProblem = req.params.problemName;
                submission.cpp = req.body.clientSource;

                Submission.create(submission, (err, subm) => {
                    if (err || !subm) {
                        console.log(err);
                        req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                        res.redirect("/problemset/" + req.params.problemName);
                    } else {
                        
                        req.flash(flashMessages.successfullySubmited.type, flashMessages.successfullySubmited.message);
                        res.redirect("/problemset/" + req.params.problemName);
                    }
                });
            }
        }); 
    }
});

router.get("/problemset/:problemName/allSubm", authMiddleware.isLoggedIn, (req, res) => {
    if(req.user.isAdmin) {
        Submission.find({toProblem: req.params.problemName}).sort({created: -1}).exec((err, submissions) => {
            if(err || !submissions) {
                console.log(err);
                req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                res.redirect("/problemset");
            } else {
                res.render("problemset/allSubm", {problem: req.params.problemName, submissions: submissions});
            }
        });
    } else {
        Submission.find({toProblem: req.params.problemName, author: req.user.username}).sort({created: -1}).exec((err, submissions) => {
            if(err || !submissions) {
                console.log(err);
                req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                res.redirect("/problemset");
            } else {
                res.render("problemset/allSubm", {problem: req.params.problemName, submissions: submissions});
            }
        });   
    }
});

module.exports = router;