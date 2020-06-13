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

const authMiddleware = require("./middleware/auth");

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

app.use(function (req, res, next) {
    res.locals.user = req.user;
    res.locals.isLoggedIn = req.isAuthenticated();
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

const { isAuthenticated } = require("./middleware/auth");

///SEEDER
// const seeder = require("./seedDB");
// seeder();

///-----------------------///
///ROOT
///-----------------------///
app.get("/", (req, res) => {
    res.render("root.ejs");
});

///-----------------------///
///FEED
///-----------------------///
app.get("/posts", (req, res) => {
    Post.find({}, (err, posts) => {
        if(err || !posts) {
            console.log(err);
            res.redirect("/posts");
        } else {
            res.render("posts", {posts: posts});
        }
    });
});

///-----------------------///
///FORM TO ADD NEW POST
///-----------------------///
app.get("/posts/new", authMiddleware.isLoggedIn, (req, res) => {
    res.render("newPost");
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
            res.redirect("/posts");
        } else {
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
            res.redirect("/posts");
        } else {
            res.render("editPost", {post: post});
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
            res.redirect("/");
        } else {
            res.redirect("/posts/" + req.params.id);
        }
    });
});


///-----------------------///
///SHOW FULL POST
///-----------------------///
app.get("/posts/:id", (req, res) => {
    Post.findById(req.params.id).populate("comments").exec((err, post) => {
        if(err || !post) {
            console.log(err);
            res.redirect("/posts");
        } else {
            res.render("show", {post: post});
        }
    });
});

///-----------------------///
///DELETE POST
///-----------------------///
app.delete("/posts/:id", (req, res) => {
    Post.findByIdAndRemove(req.params.id, err => {
        if(err) {
            console.log(err);
        }

        res.redirect("/posts");
    })
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
    res.render("register");
});

app.post("/register", function (req, res) {
    var newUser = new User({ username: req.body.username });
    User.register(newUser, req.body.password, (err, user) => {
        if (err || !user) {
            console.log(err);
            res.redirect("/posts");
        }
        passport.authenticate("local")(req, res, function () {
            res.redirect("/posts");
        });
    });
});

app.get('/logout', function (req, res) {
    req.logout();
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
        } else {
            Comment.create(newComment, (err, comment) => {
                if(err || !comment) {
                    console.log(err);
                } else {
                    post.comments.push(comment);
                    post.save();
                }
            });
        }
    });

    res.redirect("/posts/" + req.params.id);
});

///-----------------------///
///DELETE COMMENT
///-----------------------///
app.delete("/posts/:post_id/comments/:comment_id", authMiddleware.isLoggedIn, authMiddleware.isCommentOwned, (req, res) => {
    Comment.findByIdAndDelete(req.params.comment_id, err => {
        if(err) {
            console.log(err);
            res.redirect("/posts");
        } else {
            res.redirect("/posts/" + req.params.post_id);
        }
    });
});

///-----------------------///
///CATCH ALL
///-----------------------///
app.get("*", (req, res) => {
    res.render("notFound.ejs");
});

///-----------------------///
///START SERVER///
///-----------------------///
app.listen(3000, () => {
    console.log("Server started. Listening to port 3000...");
});