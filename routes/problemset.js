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


//-------------//
//MOVED TO QUEUE
//-------------//
// async function processLineByLine(req, red, submId) {
//     const fileStream = fs.createReadStream("CheckerEnv/Checker/results.txt");

//     const rl = readline.createInterface({
//         input: fileStream,
//         crlfDelay: Infinity
//     });
//     // Note: we use the crlfDelay option to recognize all instances of CR LF
//     // ('\r\n') in input.txt as a single line break.

//     let res = [];
//     let verdict = "Accepted";

//     for await (const line of rl) {
//         // Each line in input.txt will be successively available here as `line`.
//         // console.log(`Line from file: ${line}`);

//         if(line === "0") {
//             res.push("Correct");
//         } else if(line === "1") {
//             res.push("Wrong answer");
//             if(verdict === "Accepted") {
//                 verdict = "Wrong Answer";
//             }
//         } else if(line === "2") {
//             res.push("Time limit exceeded");
//             if (verdict === "Accepted") {
//                 verdict = "Time limit exceeded";
//             }
//         } else {
//             res.push("Runtime error");
//             if (verdict === "Accepted") {
//                 verdict = "Runtime Error";
//             }
//         }
//     }

//     if(res.length === 0) {
//         verdict = "Compilation Error";
//     }

//     let compilerMessage = fs.readFileSync('CheckerEnv/Checker/compilation.txt', "utf8");
    
//     Submission.findByIdAndUpdate(submId, {judged: true, compilerMessage: compilerMessage, results: res, verdict: verdict}, (err, subm) => {
//         if(err || !subm) {
//             console.log();
//             req.flash("fail", "Couldn`t judge your submission. Please try again...");
//             red.redirect("/problemset");
//         } else {
            
//             if(verdict === "Accepted") {
//                 User.findOne({username: subm.author}, (err, user) => {
//                     if(err || !user) {
//                         ///nothing to worry really
//                     } else {
//                         let alreadySolved = false;

//                         for(const pb of user.solvedProblems) 
//                             if(pb === subm.toProblem) {
//                                 alreadySolved = true;
//                                 break;
//                             }

//                         if(!alreadySolved) {
//                             user.solvedProblems.push(subm.toProblem);
//                             user.rating = user.rating + 100;
//                             user.save();
                            
//                             Problem.findOne({name: subm.toProblem}, (err, prob) => {
//                                 if(err || !prob) {
//                                     ///nothing to worry really
//                                 } else {
//                                     prob.solvedBy = prob.solvedBy + 1;
//                                     prob.save();
//                                 }
//                             });
//                         }
//                     }
//                 });
//             }
            
//             red.redirect("/problemset/" + subm.toProblem);
//         }
//     });
// }

router.post("/problemset/:problemName", authMiddleware.isLoggedIn, (req, res) => {
    
    let now = new Date();
    let diffMs = (now - req.user.lastSubmission);

    // console.log("----");
    // console.log(now);
    // console.log(req.user.lastSubmission);
    // console.log("----");

    let diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

    ///final version, modify back to two mins!
    if(diffMins < 1 && (req.user.lastSubmission !== null)) {
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
                        
                        req.flash(flashMessages.successfullySubmited.type, flashMessages.successfullySubmited.message);
                        res.redirect("/problemset");
                        
                        //-------------//
                        //MOVED TO QUEUE
                        //-------------//
                        // console.log(subm);

                        // fs.writeFileSync("CheckerEnv/Checker/current.txt", submission.cpp, "utf8");

                        // const commandString = "sh CheckerEnv/Checker/check.sh " + req.params.problemName;
                        // //console.log(commandString);
                        // // req.flash(flashMessages.successfullySubmited.type, flashMessages.successfullySubmited.message);
                        // // res.redirect("/problemset");

                        // shell.exec(commandString);
                        
                        // processLineByLine(req, res, subm.id);
                    }
                });
            }
        }); 
    }
});

router.get("/problemset/:problemName/allSubm", authMiddleware.isLoggedIn, authMiddleware.isAdmin, (req, res) => {
    Submission.find({toProblem: req.params.problemName}).sort({created: -1}).exec((err, submissions) => {
        if(err || !submissions) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/problemset");
        } else {
            res.render("problemset/allSubm", {problem: req.params.problemName, submissions: submissions});
        }
    });
});

module.exports = router;