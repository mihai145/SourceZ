const passportLocalMongoose = require("passport-local-mongoose");

const Post = require("../models/post");
const Comment = require("../models/comment");
const Submission = require("../models/submission");

const flashMessages = require("../utils/flashMessages"); 

const authMiddleware = {};

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        req.flash("fail", "You need to be logged in to do that!");
        return res.redirect("/posts");
    }
}

function isNotLoggedIn(req, res, next) {
    if (!req.isAuthenticated()) {
        next();
    } else {
        req.flash("fail", "You are already logged in, " + req.user.username + "!");
        return res.redirect("/posts");
    }
}

function isPostOwned(req, res, next) {
    Post.findById(req.params.id, (err, post) => {
        if(err || !post) {
            console.log(err);
            return res.redirect("/posts");
        } else {
            if(post.author !== req.user.username) {
                req.flash("fail", "You do not have enough permissions to do that!");
                return res.redirect("/posts");
            } else {
                next();
            }
        }
    });
}

function isNotPostOwned(req, res, next) {
    Post.findById(req.params.id, (err, post) => {
        if (err || !post) {
            console.log(err);
            return res.redirect("/posts");
        } else {
            if (post.author !== req.user.username) {
                next();
            } else {
                return res.redirect("/posts");
            }
        }
    });
}

function isCommentOwned(req, res, next) {
    Comment.findById(req.params.comment_id, (err, comm) => {
        if (err || !comm) {
            console.log(err);
            return res.redirect("/posts");
        } else {
            if (comm.author !== req.user.username) {
                req.flash("fail", "You do not have enough permissions to do that!");
                return res.redirect("/posts");
            } else {
                next();
            }
        }
    });
}

function isAdmin(req, res, next) {
    if(!req.isAuthenticated()) {
        req.flash("fail", "You are not authenticated!");
        return res.redirect("/problemset");
    }

    if(req.user.isAdmin) {
        return next();
    }

    req.flash("fail", "You do not have enough permissions to do that!");
    return res.redirect("/posts");
}

function isOwner(req, res, next) {
    if (!req.isAuthenticated()) {
        req.flash("fail", "You are not authenticated!");
        return res.redirect("/problemset");
    }

    if (req.user.isOwner) {
        return next();
    }

    req.flash("fail", "You do not have enough permissions to do that!");
    return res.redirect("/posts");
}

function submissionAuth(req, res, next) {
    
    if(req.user.isAdmin) {
        return next();
    }

    Submission.findById(req.params.id, (err, submission) => {
        if(err || !submission) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            return res.redirect("/problemset/submissions");
        } else {
            if(req.user.username === submission.author) {
                return next();
            } else {
                req.flash("fail", "You do not have enough permissions to do that!");
                return res.redirect("/problemset/submissions");
            }
        }
    });
}

authMiddleware.isLoggedIn = isLoggedIn;
authMiddleware.isPostOwned = isPostOwned;
authMiddleware.isCommentOwned = isCommentOwned;

authMiddleware.isNotLoggedIn = isNotLoggedIn;
authMiddleware.isNotPostOwned = isNotPostOwned;

authMiddleware.isAdmin = isAdmin;
authMiddleware.isOwner = isOwner;

authMiddleware.submissionAuth = submissionAuth;

module.exports = authMiddleware;