const express = require("express");
const app = express();

const bodyParser = require('body-parser');

const mongoose = require("mongoose");

const Post = require("./models/post");
const Comment = require("./models/comment");

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

///-----------------------///
///DATABASE SETUP
///-----------------------///
mongoose.connect('mongodb://localhost/cute_pet_project', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const seeder = require("./seedDB");
seeder();

///-----------------------///
///ROOT
///-----------------------///
app.get("/", (req, res) => {
    res.render("root.ejs");
})


///-----------------------///
///FEED
///-----------------------///
app.get("/posts", (req, res) => {
    Post.find({}).populate("comments").exec((err, posts) => {
        if(err || !posts) {
            console.log(err);
            res.redirect("/posts");
        } else {
            res.render("posts", {posts: posts});
        }
    });
});

///-----------------------///
///NEW POST
///-----------------------///
app.post("/posts", (req, res) => {
    let newPost = req.body.post;
    newPost.author = "catag";
    newPost.date = "today";

    Post.create(newPost, (err, post) => {
        if(err || !post) {
            console.log(err);
            res.redirect("/posts");
        } else {
            res.redirect("/posts");
        }
    });
});


///-----------------------///
///NEW COMMENT
///-----------------------///
app.post("/posts/:id", (req, res) => {
    let newComment = req.body.comment;
    newComment.author = "crazyBoy";

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

    res.redirect("/posts");
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