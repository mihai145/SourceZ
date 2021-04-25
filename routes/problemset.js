const express = require('express');
const router = express.Router();

const passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

const authMiddleware = require("../utils/authorizationMiddleware");
const flashMessages = require("../utils/flashMessages");

const Problem = require("../models/problem");
const Submission = require("../models/submission");
const User = require('../models/user');
const Contest = require("../models/contest");
const Registration = require("../models/registration");

///-----------------------///
///PROBLEMSET INDEX PAGE
///-----------------------///
router.get("/problemset", (req, res) => {
    Problem.find({fromContest: "none"}, (err, problems) => {
        Contest.find({}).sort({created: -1}).then(contests => {
            res.render("problemset/index", {problems: problems, contests: contests});
        });
    });
});

///-----------------------///
///PROBLEMSET SUBMISSIONS PAGE
///-----------------------///
router.get("/problemset/submissions", authMiddleware.isLoggedIn, (req, res) => {
    Submission.find({}).sort({ created: -1 }).limit(20).then(submissions => {
        res.render("problemset/queue", {submissions: submissions});
    });
});

///-----------------------///
///SUBMISSION VIEW PAGE
///-----------------------///
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

///-----------------------///
///NEW PROBLEM FORM
///-----------------------///
router.get("/problemset/newPb", authMiddleware.isOwner, (req, res) => {
    res.render("problemset/addProblem");
});

///-----------------------///
///ADD NEW PROBLEM
///-----------------------///
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

///-----------------------///
///PROBLEM VIEW PAGE
///-----------------------///
router.get("/problemset/:problemName", (req, res) => {
    Problem.findOne({name: req.params.problemName}, (err, problem) => {
        if(err || !problem) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/problemset");
        } else {

            if(Date.now() < problem.visibleFrom && !(req.isAuthenticated() && req.user.isOwner)) {
                req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                return res.redirect("/problemset");
            }

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

///-----------------------///
///PROBLEM EDIT FORM
///-----------------------///
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

///-----------------------///
///EDIT PROBLEM
///-----------------------///
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

///-----------------------///
///SUBMIT PROBLEM
///-----------------------///
function SubmitProblem(req, res, toContest, problemNumber) {
    let now = new Date();
    let diffMs = (now - req.user.lastSubmission);

    let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

    ///cooldown time between two submissions
    if (diffMins < 2 && (req.user.lastSubmission !== null)) {
        req.flash("fail", "You submitted a solution less than two minutes ago. You can only submit once every two minutes");
        res.redirect("/problemset/" + req.params.problemName);
    } else {

        ///BASIC CPP SANITIZATION
        if (req.body.clientSource.indexOf("remove") !== -1) {
            req.flash("fail", "Remove is a reserved keyword and it cannot be used in source code");
            return res.redirect("/problemset/" + req.params.problemName);
        } else if (req.body.clientSource.indexOf("system") !== -1) {
            req.flash("fail", "System is a reserved keyword and it cannot be used in source code");
            return res.redirect("/problemset/" + req.params.problemName);
        } else if (req.body.clientSource.indexOf("\"" + req.params.problemName + ".in\"") == -1) {
            req.flash("fail", "Input file named " + req.params.problemName + ".in " + " not detected. Try again...");
            return res.redirect("/problemset/" + req.params.problemName);
        } else if (req.body.clientSource.indexOf("\"" + req.params.problemName + ".out\"") == -1) {
            req.flash("fail", "Output file named " + req.params.problemName + ".out " + " not detected. Try again...");
            return res.redirect("/problemset/" + req.params.problemName);
        }

        User.findOneAndUpdate({ username: req.user.username }, { lastSubmission: now }, (err, user) => {
            if (err || !user) {
                console.log(err);
                req.flash("fail", "Couldn`t save your submission. Try again...");
                res.redirect("/problemset/" + req.params.problemName);
            } else {
                let submission = {};

                submission.author = req.user.username;
                submission.toProblem = req.params.problemName;
                submission.cpp = req.body.clientSource;
                submission.toContest = toContest;
                submission.pbInContest = problemNumber;

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
}

router.post("/problemset/:problemName", authMiddleware.isLoggedIn, (req, res) => {
    
    if(!(req.isAuthenticated() && req.user.isOwner)) {
        Problem.findOne({name: req.params.problemName}, (err, problem) => {
            if(err || !problem) {
                console.log(err);
                req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                return res.redirect("/problemset");
            }

            if (Date.now() < problem.visibleFrom) {
                req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                return res.redirect("/problemset");
            }
            
            if(problem.fromContest !== "none") {
                Contest.findOne({title: problem.fromContest}, (err, contest) => {
                    
                    if(Date.now() < contest.finishDate) {
                        ///CHECK IF USER IS REGISTERED FOR CONTEST
                        Registration.findOne({contestant: req.user.username, contest: problem.fromContest}, (err, reg) => {
                            if(err || !reg) {
                                req.flash("fail", "You are not registered to this contest. You can try this problem after the contest ends.");
                                return res.redirect("/problemset");
                            } else {
                                ///NON-OWNER SUBMITTING IN CONTEST MODE
                                if(contest.problem1 == req.params.problemName) {
                                    SubmitProblem(req, res, problem.fromContest, 1);
                                } else {
                                    SubmitProblem(req, res, problem.fromContest, 2);    
                                }
                            }
                        });

                    } else {
                        SubmitProblem(req, res, "", 0);
                    } 
                });
            } else {
                ///NON-OWNER SUBMITTING IN ARCHIVE MODE
                SubmitProblem(req, res, "", 0);
            } 
        });
    } else {
        ///OWNER CAN SUBMIT ANY TIME IN ARCHIVE MODE
        SubmitProblem(req, res, "", 0);
    }
});

///-----------------------///
///VIEW ALL SUBMISSIONS FOR A CERTAIN PROBLEM
///-----------------------///
function FetchSubmissions(req, res) {
    if (req.user.isAdmin) {
        Submission.find({ toProblem: req.params.problemName }).sort({ created: -1 }).exec((err, submissions) => {
            if (err || !submissions) {
                console.log(err);
                req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                res.redirect("/problemset");
            } else {
                res.render("problemset/allSubm", { problem: req.params.problemName, submissions: submissions });
            }
        });
    } else {
        Submission.find({ toProblem: req.params.problemName, author: req.user.username }).sort({ created: -1 }).exec((err, submissions) => {
            if (err || !submissions) {
                console.log(err);
                req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                res.redirect("/problemset");
            } else {
                res.render("problemset/allSubm", { problem: req.params.problemName, submissions: submissions });
            }
        });
    }
}

router.get("/problemset/:problemName/allSubm", authMiddleware.isLoggedIn, (req, res) => {
    
    if(!req.user.isOwner) {
        Problem.findOne({name: req.params.problemName}, (err, problem) => {
            if(err || !problem) {
                console.log(err);
                req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                return res.redirect("/problemset");
            }

            if (Date.now() < problem.visibleFrom) {
                req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                return res.redirect("/problemset");
            } else {
                FetchSubmissions(req, res);
            }
        });
    } else {
        FetchSubmissions(req, res);
    }
});

module.exports = router;