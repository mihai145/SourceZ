const express = require("express");
const app = express();

const bodyParser = require('body-parser');

const mongoose = require("mongoose");

const Post = require("./models/post");
const Comment = require("./models/comment");
const User = require("./models/user");

const passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

const session = require("express-session");
const methodOverride = require("method-override");

const authMiddleware = require("./utils/authorizationMiddleware");
const flashMessages = require("./utils/flashMessages");
const user = require("./models/user");

///-----------------------///
///APP SETUP
///-----------------------///
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/bootstrap"));
app.use(express.static(__dirname + "/cssFiles"));

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
})); 

app.use(methodOverride('_method'))

app.use(session({ 
    secret: "mihai145",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(require("connect-flash")());

app.use(function (req, res, next) {
    res.locals.user = req.user;
    res.locals.isLoggedIn = req.isAuthenticated();
    res.locals.successFlash = req.flash("success");
    res.locals.failFlash = req.flash("fail");
    next();
});

///-----------------------///
///DATABASE SETUP
///-----------------------///
mongoose.connect('mongodb://localhost/cute_pet_project', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

///-----------------------///
///ROOT
///-----------------------///
app.get("/", (req, res) => {
    res.render("misc/root");
});

///-----------------------///
///FEED
///-----------------------///
app.get("/posts", (req, res) => {
    Post.find({}, (err, posts) => {
        if(err || !posts) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/posts");
        } else {
            User.find().sort({ rating: -1 }).limit(8).then(users => {
                res.render("feed/posts", { posts: posts , topUsers: users});
            });
        }
    });
});

///-----------------------///
///FORM TO ADD NEW POST
///-----------------------///
app.get("/posts/new", authMiddleware.isLoggedIn, (req, res) => {
    res.render("feed/newPost");
}); 

///-----------------------///
///NEW POST
///-----------------------///
app.post("/posts", authMiddleware.isLoggedIn, (req, res) => {
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
app.get("/posts/:id/edit", authMiddleware.isLoggedIn, authMiddleware.isPostOwned, (req, res) => {
    Post.findById(req.params.id, (err, post) => {
        if(err || !post) {
            console.log(err);
            req.flash(flashMessages.messages.defaultFail.type, flashMessages.messages.defaultFail.message);
            res.redirect("/posts");
        } else {
            res.render("feed/editPost", {post: post});
        }
    })
});

///-----------------------///
///EDIT POST
///-----------------------///
app.put("/posts/:id", authMiddleware.isLoggedIn, authMiddleware.isPostOwned, (req, res) => {
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
app.get("/posts/:id", (req, res) => {
    let apreciated = -1;

    if(req.isAuthenticated()) {
            Post.findById(req.params.id, (err, post) => {
                if(!err && post) {
                    for (const apreciator of post.codepreciatedBy) {
                        if(req.user.username === apreciator) {
                            apreciated = 1;
                        }
                    }
                    
                    if(apreciated === -1)
                        apreciated = 0;
                }
            });
    }

    Post.findById(req.params.id).populate("comments").exec((err, post) => {
        if(err || !post) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/posts");
        } else {
            res.render("feed/show", {post: post, apreciated: apreciated});
        }
    });
});

///-----------------------///
///CODEPRECIATE POST
///-----------------------///

async function AddRating(name, add) {
    let userId = -1, userRating = -1;
    
    await User.findOne({username : name}, (err, user) => {
        if(err || !user) {
            console.log(err);
        } else {
            userId = user._id;
            userRating = user.rating;
        }
    });

    // console.log(userId);
    // console.log(userRating);

    if(userId && userRating && userId !== -1 && userRating !== -1) {
        User.findByIdAndUpdate(userId, {rating : userRating + add}, (err, user) => {
            if(err || !user) {
                console.log(err);
            }
        });
    }
}

app.post("/posts/:id/codepreciate", authMiddleware.isLoggedIn, authMiddleware.isNotPostOwned, (req, res) => {
    
    Post.findById(req.params.id, (err, post) => {
        if(err || !post) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/posts");
        } else {

            let apreciated = false;

            for(const apreciator of post.codepreciatedBy) {
                if(req.user.username === apreciator) {
                    apreciated = true;
                    break;
                }
            }

            if(!apreciated) {
                AddRating(post.author, +3);

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
                AddRating(post.author, -3);

                post.codepreciations -= 1;
                
                let indexToDelete = -1;
                for(let i = 0; i < post.codepreciatedBy.length; i++)
                    {
                        if(req.user.username === post.codepreciatedBy[i]) {
                            indexToDelete = i;
                            break;
                        }
                    }

                if(indexToDelete !== -1) {
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
///DELETE POST
///-----------------------///
app.delete("/posts/:id", (req, res) => {
    Post.findById(req.params.id, (err, post) => {
        if(err || !post) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            return res.redirect("/posts");
        } else {
            let fail = false;
            
            for(const commentId of post.comments) {
                Comment.findByIdAndRemove(commentId, err => {
                    if(err) {
                        console.log(err);
                        fail = true;
                    }
                });
            }

            if(fail) {
                req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                return res.redirect("/posts");
            }
        }
    });

    Post.findByIdAndRemove(req.params.id, err => {
        if(err) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/posts");
        } else {
            req.flash(flashMessages.postDeleted.type, flashMessages.postDeleted.message);
            res.redirect("/posts");
        }
    });
});

///-----------------------///
///LOGIN, REGISTRATION, LOGOUT
///-----------------------///
app.post('/login',
    passport.authenticate('local', {
        successRedirect: '/posts',
        failureRedirect: '/'
}));

app.get("/register", (req, res) => {
    res.render("misc/register");
});

app.post("/register", function (req, res) {
    var newUser = new User({ username: req.body.username });
    User.register(newUser, req.body.password, (err, user) => {
        if (err || !user) {
            console.log(err);
            req.flash("fail", err.message);
            res.redirect("/posts");
        }
        passport.authenticate("local")(req, res, function () {
            if(user.username) {
                req.flash("success", "Welcome, " + user.username);
            } else {
                req.flash("Welcome!");
            }
            res.redirect("/posts");
        });
    });
});

app.get('/logout', function (req, res) {
    req.logout();
    req.flash("success", "See you later!");
    res.redirect('/posts');
});


///-----------------------///
///NEW COMMENT
///-----------------------///
app.post("/posts/:id", authMiddleware.isLoggedIn, (req, res) => {
    let newComment = req.body.comment;
    newComment.author = req.user.username;

    Post.findById(req.params.id, (err, post) => {
        if(err || !post) {
            console.log(err);
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            res.redirect("/posts");
        } else {
            Comment.create(newComment, (err, comment) => {
                if(err || !comment) {
                    console.log(err);
                    req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
                    res.redirect("/posts");
                } else {
                    post.comments.push(comment);
                    post.save((err, post) => {
                        if(err || !post) {
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

            //-----------DEBUG CODE----------------------//
            // console.log("-------------------BEFOR-----");
            // for (let i = 0; i < post.comments.length; i++)
            //     console.log(post.comments[i]._id.toString());
            //-----------DEBUG CODE----------------------//

            for (let i = 0; i < post.comments.length; i++) {

                //-----------DEBUG CODE----------------------//
                // console.log("--------------");
                // console.log(indexToDelete);
                // console.log(post.comments[i]._id.toString());
                // console.log("--------------");
                //-----------DEBUG CODE----------------------//

                if (commentId === post.comments[i]._id.toString()) {
                    indexToDelete = i;
                }
            }

            post.comments.splice(indexToDelete, 1);

            //-----------DEBUG CODE----------------------//
            // console.log("-------------------AFTR-----");
            // for (let i = 0; i < post.comments.length; i++)
            //     console.log(post.comments[i]._id.toString());
            //-----------DEBUG CODE----------------------//

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
        if(err) {
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

app.delete("/posts/:post_id/comments/:comment_id", authMiddleware.isLoggedIn, authMiddleware.isCommentOwned, (req, res) => {
    DoDelete(req, res, req.params.post_id, req.params.comment_id);
});

app.get("/leaderboard", (req, res) => {
    User.find().sort({rating: -1}).limit(50).then(users => {
        if(!users || users.length === 0) {
            req.flash(flashMessages.defaultFail.type, flashMessages.defaultFail.message);
            return res.redirect("/posts");
        } else {
            res.render("misc/leaderboard", {users : users});
        }
    });
});

///-----------------------///
///ABOUT PAGE
///-----------------------///
app.get("/about", (req, res) => {
    res.render("misc/about");
});

///-----------------------///
///VIEW PROFILE
///-----------------------///
app.get("/me", authMiddleware.isLoggedIn, (req, res) => {
    res.render("misc/me");
});

///-----------------------///
///CATCH ALL
///-----------------------///
app.get("*", (req, res) => {
    res.render("misc/notFound");
});

///-----------------------///
///START SERVER///
///-----------------------///
app.listen(3000, () => {
    console.log("Server started. Listening to port 3000...");
});