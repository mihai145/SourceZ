const passportLocalMongoose = require("passport-local-mongoose");
const Post = require("../models/post");
const Comment = require("../models/comment");

const authMiddleware = {};

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
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
                return res.redirect("/posts");
            } else {
                next();
            }
        }
    });
}

authMiddleware.isLoggedIn = isLoggedIn;
authMiddleware.isPostOwned = isPostOwned;
authMiddleware.isCommentOwned = isCommentOwned;

authMiddleware.isNotPostOwned = isNotPostOwned;

module.exports = authMiddleware;