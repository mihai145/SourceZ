const express = require('express');
const router = express.Router();

const authMiddleware = require("../utils/authorizationMiddleware");
const flashMessages = require("../utils/flashMessages");

const Problem = require("../models/problem");
const Contest = require("../models/contest");
const Registration = require("../models/registration");

///-----------------///
///-----------------///
///-----------------///

///CONTESTS///

///-----------------///
///-----------------///
///-----------------///

router.get("/contests/new", authMiddleware.isLoggedIn, authMiddleware.isAdmin, (req, res) => {
    res.render("contests/new");
});

router.get("/contests/:id", (req, res) => {
    Contest.findById(req.params.id, (err, contest) => {
        if (err || !contest) {
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            return res.redirect("/problemset");
        }

        Registration.find({contest: contest.title}).sort({total_score: -1}).exec((err, registrations) => {
            res.render("contests/show", { contest: contest , registrations: registrations});
        });

    });
});

router.post("/contests", authMiddleware.isLoggedIn, authMiddleware.isAdmin, (req, res) => {

    const problem1 = {}, problem2 = {};

    problem1.name = req.body.p1_name;
    problem1.author = req.body.contest.author;
    problem1.content = req.body.p1_statement;
    problem1.timeLimit = req.body.p1_tl;
    problem1.memoryLimit = req.body.p1_ml;
    problem1.fromContest = req.body.contest.title;
    problem1.visibleFrom = req.body.contest.startDate;

    problem2.name = req.body.p2_name;
    problem2.author = req.body.contest.author;
    problem2.content = req.body.p2_statement;
    problem2.timeLimit = req.body.p2_tl;
    problem2.memoryLimit = req.body.p2_ml;
    problem2.fromContest = req.body.contest.title;
    problem2.visibleFrom = req.body.contest.startDate;

    const newContest = req.body.contest;
    newContest.problem1 = req.body.p1_name;
    newContest.problem2 = req.body.p2_name;

    Contest.create(newContest, (err, contest) => {
        if (err || !contest) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            return res.redirect("/problemset");
        }

        Problem.create(problem1);
        Problem.create(problem2);

        res.redirect("/problemset");
    });
});

router.post("/contests/:contestId/register", authMiddleware.isLoggedIn, authMiddleware.isNotRegisteredForContest, (req, res) => {
    const registration = {};

    registration.contestant = req.user.username;
    registration.p1_score = 0;
    registration.p2_score = 0;
    registration.total_score = 0;

    Contest.findById(req.params.contestId, (err, contest) => {

        if (err || !contest) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            return res.redirect("/problemset");
        }

        registration.contest = contest.title;
        Registration.create(registration, (err, reg) => {

            if (err || !reg) {
                console.log(err);
                req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                res.redirect("/problemset");
            } else {
                req.flash("success", "Successfully registered!");
                res.redirect("/problemset");
            }
        });
    });

});

router.post("/contests/:contestId/unregister", authMiddleware.isLoggedIn, authMiddleware.isRegisteredForContest, (req, res) => {

    Contest.findById(req.params.contestId, (err, contest) => {

        if (err || !contest) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            return res.redirect("/problemset");
        }

        Registration.deleteOne({contestant: req.user.username, contest: contest.title}, err => {
                if(err) {
                    console.log(err);
                    req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                    res.redirect("/problemset");
                } else {
                    req.flash("success", "Successfully unregistered!");
                    res.redirect("/problemset");
                }
            }
        );
    });

});

router.get("/contests/:contestId/edit", authMiddleware.isLoggedIn, authMiddleware.isOwner, (req, res) => {
    Contest.findById(req.params.contestId, (err, contest) => {
        if (err || !contest) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            return res.redirect("/problemset");
        }

        res.render("contests/edit", { contest: contest });
    });
});

router.put("/contests/:contestId", authMiddleware.isLoggedIn, authMiddleware.isOwner, (req, res) => {
    const editedContest = req.body.contest;
    editedContest.problem1 = req.body.p1_name;
    editedContest.problem2 = req.body.p2_name;

    Contest.findByIdAndUpdate(req.params.contestId, editedContest, (err, contest) => {
        if (err || !contest) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            return res.redirect("/problemset");
        }

        Problem.findOneAndUpdate({ name: editedContest.problem1 }, { $set: { visibleFrom: editedContest.startDate } }, (err, pb) => { });
        Problem.findOneAndUpdate({ name: editedContest.problem2 }, { $set: { visibleFrom: editedContest.startDate } }, (err, pb) => { });

        res.redirect("/problemset");
    });
});

module.exports = router;