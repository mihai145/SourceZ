const express = require('express');
const router = express.Router();

const passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

const User = require("../models/user");

const authMiddleware = require("../utils/authorizationMiddleware");
const flashMessages = require("../utils/flashMessages");

///-----------------------///
///ROOT
///-----------------------///
router.get("/", (req, res) => {
    res.render("misc/root");
});

///-----------------------///
///LOGIN, REGISTRATION, LOGOUT
///-----------------------///
router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/posts',
        failureRedirect: '/'
    }));

router.get("/register", (req, res) => {
    res.render("misc/register");
});

router.post("/register", function (req, res) {
    var newUser = new User({ username: req.body.username });
    User.register(newUser, req.body.password, (err, user) => {
        if (err || !user) {
            console.log(err);
            req.flash("fail", err.message);
            res.redirect("/posts");
        }
        passport.authenticate("local")(req, res, function () {
            if (user.username) {
                req.flash("success", "Welcome, " + user.username);
            } else {
                req.flash("Welcome!");
            }
            res.redirect("/posts");
        });
    });
});

router.get('/logout', function (req, res) {
    req.logout();
    req.flash("success", "See you later!");
    res.redirect('/posts');
});

///-----------------------///
///LEADERBOARD PAGE
///-----------------------///
router.get("/leaderboard", (req, res) => {
    User.find().sort({ rating: -1 }).limit(50).then(users => {
        if (!users || users.length === 0) {
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            return res.redirect("/posts");
        } else {
            res.render("misc/leaderboard", { users: users });
        }
    });
});

///-----------------------///
///ABOUT PAGE
///-----------------------///
router.get("/about", (req, res) => {
    res.render("misc/about");
});

///-----------------------///
///VIEW PROFILE
///-----------------------///
router.get("/me", authMiddleware.isLoggedIn, (req, res) => {
    res.render("misc/me");
});

///-----------------------///
///CATCH ALL
///-----------------------///
router.get("*", (req, res) => {
    res.render("misc/notFound");
});


module.exports = router;