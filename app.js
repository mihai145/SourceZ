const express = require("express");
const app = express();

const bodyParser = require('body-parser');

const mongoose = require("mongoose");

const Post = require("./models/post");

///-----------------------///
///APP SETUP
///-----------------------///
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/bootstrap"));

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