const express = require('express');
const router = express.Router();
const fetch = require("node-fetch");

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
        failureRedirect: "/loginFailed"
    }), (req, res) => {
    req.flash("success", "Welcome!");
    res.redirect("/posts");
});

router.get("/loginFailed", (req, res) => {
    if(!req.user) {
        req.flash("fail", "Invalid username or password...");
    }
    res.redirect("/posts");
});

router.get("/register", authMiddleware.isNotLoggedIn, (req, res) => {
    res.render("misc/register");
});

router.post("/register", authMiddleware.isNotLoggedIn, function (req, res) {

    ///check username validity
    const username = req.body.username;
    let hasSpace = false;
    let specialChars = false;
    let hasLetter = false;

    for(let i = 0; i < username.length; i++) {
        if(username[i] == ' ' ) {
            hasSpace = true;
        }
        let code = username.charCodeAt(i);
        if (!(code > 47 && code < 58) && // numeric (0-9)
            !(code > 64 && code < 91) && // upper alpha (A-Z)
            !(code > 96 && code < 123) && // lower alpha (a-z) 
            !(username[i] == '_')) { 
                specialChars = true;
        }
        if ((code > 64 && code < 91) || (code > 96 && code < 123)) {
            hasLetter = true;
        }
    }

    if (hasSpace === true) {
        req.flash("fail", "Any username should be a single word!");
        return res.redirect("/register");
    } else if(specialChars === true) {
        req.flash("fail", "Any username should be alphanumeric. Only underscores are allowed.");
        return res.redirect("/register");
    } else if(hasLetter === false) {
        req.flash("fail", "Any username should have at least one letter.");
        return res.redirect("/register");
    }

    ///check reCaptcha
    fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST', secret: process.env.CAPTCHA_API_KEY, response: req.body.token})
        .then(res => res.json())
        .then(json => console.log(json));

    var newUser = new User({ username: username });
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
///MAKE NEW ADMIN
///-----------------------///
router.post("/newAdmin", authMiddleware.isLoggedIn, authMiddleware.isOwner, (req, res) => {
    User.findOneAndUpdate({username: req.body.username}, {isAdmin: true}, (err, user) => {
        if(err || !user) {
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/me");
        } else {
            req.flash(flashMessages.defaultSuccess.type, flashMessages.defaultSuccess.message);
            res.redirect("/posts");   
        }
    });
});

///-----------------------///
///CATCH ALL
///-----------------------///
router.get("*", (req, res) => {
    res.render("misc/notFound");
});


module.exports = router;