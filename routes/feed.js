const express = require('express');
const router = express.Router();

const passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

const User = require("../models/user");
const Post = require("../models/post");
const Comment = require("../models/comment");

const authMiddleware = require("../utils/authorizationMiddleware");
const flashMessages = require("../utils/flashMessages");

///-----------------------///
///FEED
///-----------------------///
router.get("/posts", (req, res) => {
    Post.find({}, (err, posts) => {
        if (err || !posts) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/posts");
        } else {
            User.find().sort({ rating: -1 }).limit(8).then(users => {
                res.render("feed/posts", { posts: posts, topUsers: users });
            });
        }
    });
});

///-----------------------///
///FORM TO ADD NEW POST
///-----------------------///
router.get("/posts/new", authMiddleware.isLoggedIn, authMiddleware.isAdmin, (req, res) => {
    res.render("feed/newPost");
});

///-----------------------///
///NEW POST
///-----------------------///
router.post("/posts", authMiddleware.isLoggedIn, authMiddleware.isAdmin, (req, res) => {
    let newPost = req.body.post;
    newPost.author = req.user.username;

    Post.create(newPost, (err, post) => {
        if (err || !post) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/posts");
        } else {
            req.flash(flashMessages.postCreated.type, flashMessages.postCreated.message);
            res.redirect("/posts");
        }
    });
});

///-----------------------///
///SHOW EDIT POST FORM
///-----------------------///
router.get("/posts/:id/edit", authMiddleware.isLoggedIn, authMiddleware.isPostOwned, (req, res) => {
    Post.findById(req.params.id, (err, post) => {
        if (err || !post) {
            console.log(err);
            req.flash(flashMessages.messages.defaultFail.type, flashMessages.messages.defaultFail.message);
            res.redirect("/posts");
        } else {
            res.render("feed/editPost", { post: post });
        }
    })
});

///-----------------------///
///EDIT POST
///-----------------------///
router.put("/posts/:id", authMiddleware.isLoggedIn, authMiddleware.isPostOwned, (req, res) => {
    // res.send("BINEE");
    const title = req.body.title;
    const text = req.body.text;
    Post.findByIdAndUpdate(req.params.id, { title: title, text: text }, (err, post) => {
        if (err || !post) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/");
        } else {
            req.flash(flashMessages.postEdited.type, flashMessages.postEdited.message);
            res.redirect("/posts/" + req.params.id);
        }
    });
});


///-----------------------///
///SHOW FULL POST
///-----------------------///
router.get("/posts/:id", (req, res) => {
    let apreciated = -1;

    if (req.isAuthenticated()) {
        Post.findById(req.params.id, (err, post) => {
            if (!err && post) {
                for (const apreciator of post.codepreciatedBy) {
                    if (req.user.username === apreciator) {
                        apreciated = 1;
                    }
                }

                if (apreciated === -1)
                    apreciated = 0;
            }
        });
    }

    Post.findById(req.params.id).populate("comments").exec((err, post) => {
        if (err || !post) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/posts");
        } else {
            res.render("feed/show", { post: post, apreciated: apreciated });
        }
    });
});

///-----------------------///
///DELETE POST
///-----------------------///
router.delete("/posts/:id", authMiddleware.isLoggedIn, authMiddleware.isPostOwned, (req, res) => {
    Post.findById(req.params.id, (err, post) => {
        if (err || !post) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            return res.redirect("/posts");
        } else {
            let fail = false;

            for (const commentId of post.comments) {
                Comment.findByIdAndRemove(commentId, err => {
                    if (err) {
                        console.log(err);
                        fail = true;
                    }
                });
            }

            if (fail) {
                req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                return res.redirect("/posts");
            }
        }
    });

    Post.findByIdAndRemove(req.params.id, err => {
        if (err) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/posts");
        } else {
            req.flash(flashMessages.postDeleted.type, flashMessages.postDeleted.message);
            res.redirect("/posts");
        }
    });
});

module.exports = router;