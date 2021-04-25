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
///CODEPRECIATE POST
///-----------------------///
router.post("/posts/:id/codepreciate", authMiddleware.isLoggedIn, authMiddleware.isNotPostOwned, (req, res) => {

    Post.findById(req.params.id, (err, post) => {
        if (err || !post) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/posts");
        } else {

            let apreciated = false;

            for (const apreciator of post.codepreciatedBy) {
                if (req.user.username === apreciator) {
                    apreciated = true;
                    break;
                }
            }

            if (!apreciated) {
                post.codepreciations += 1;
                post.codepreciatedBy.push(req.user.username);

                post.save((err, post) => {
                    if (err || !post) {
                        console.log(err);
                        req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                        res.redirect("/posts");
                    } else {
                        req.flash(flashMessages.codepreciated.type, flashMessages.codepreciated.message);
                        res.redirect("/posts/" + req.params.id);
                    }
                });

            } else {
                post.codepreciations -= 1;

                let indexToDelete = -1;
                for (let i = 0; i < post.codepreciatedBy.length; i++) {
                    if (req.user.username === post.codepreciatedBy[i]) {
                        indexToDelete = i;
                        break;
                    }
                }

                if (indexToDelete !== -1) {
                    post.codepreciatedBy.splice(indexToDelete, 1);
                }

                post.save((err, post) => {
                    if (err || !post) {
                        console.log(err);
                        req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                        res.redirect("/posts");
                    } else {
                        req.flash(flashMessages.notCodepreciated.type, flashMessages.notCodepreciated.message);
                        res.redirect("/posts/" + req.params.id);
                    }
                });
            }
        }
    });
});


///-----------------------///
///NEW COMMENT
///-----------------------///
router.post("/posts/:id", authMiddleware.isLoggedIn, (req, res) => {
    let newComment = req.body.comment;
    newComment.author = req.user.username;

    Post.findById(req.params.id, (err, post) => {
        if (err || !post) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/posts");
        } else {
            Comment.create(newComment, (err, comment) => {
                if (err || !comment) {
                    console.log(err);
                    req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                    res.redirect("/posts");
                } else {
                    post.comments.push(comment);
                    post.save((err, post) => {
                        if (err || !post) {
                            console.log(err);
                            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                            res.redirect("/posts");
                        } else {
                            req.flash(flashMessages.addedComment.type, flashMessages.addedComment.message);
                            res.redirect("/posts/" + req.params.id)
                        }
                    });
                }
            });
        }
    });
});

///-----------------------///
///DELETE COMMENT
///-----------------------///
async function DeleteCommentFromPost(req, res, post, comment) {
    Post.findById(post, (err, post) => {
        if (err || !post) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            return res.redirect("/posts");
        } else {
            const commentId = comment.toString();
            let indexToDelete = -1;

            for (let i = 0; i < post.comments.length; i++) {
                if (commentId === post.comments[i]._id.toString()) {
                    indexToDelete = i;
                }
            }

            post.comments.splice(indexToDelete, 1);

            post.save((err, post) => {
                if (err || !post) {
                    console.log(err);
                    req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                    return res.redirect("/posts");
                }
            });
        }
    });
}

async function DeleteComment(req, res, comment, post) {
    Comment.findByIdAndDelete(comment, err => {
        if (err) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            return res.redirect("/posts");
        } else {
            req.flash(flashMessages.commentDeleted.type, flashMessages.commentDeleted.message);
            res.redirect("/posts/" + post);
        }
    });
}

async function DoDelete(req, res, post, comment) {
    DeleteComment(req, res, comment, post);
    DeleteCommentFromPost(req, res, post, comment);
}

router.delete("/posts/:post_id/comments/:comment_id", authMiddleware.isLoggedIn, authMiddleware.isCommentOwnedOrOwner, (req, res) => {
    DoDelete(req, res, req.params.post_id, req.params.comment_id);
});

module.exports = router;