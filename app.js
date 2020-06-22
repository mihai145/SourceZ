const express = require("express");
const app = express();

const bodyParser = require('body-parser');

const mongoose = require("mongoose");
const User = require("./models/user");
const passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

const session = require("express-session");
const methodOverride = require("method-override");

const feedRoutes = require("./routes/feed");
const commentCodepreciateRoutes = require("./routes/commentCodepreciate");
const miscRoutes = require("./routes/misc");
const problemsetRoutes = require("./routes/problemset");

///-----------------------///
///APP SETUP
///-----------------------///
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/cssFiles"));
app.use(express.static(__dirname + "/lib"));

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
///ALL ROUTERS
///-----------------------///
app.use(feedRoutes);
app.use(commentCodepreciateRoutes);
app.use(problemsetRoutes);
app.use(miscRoutes);

///-----------------------///
///START SERVER
///-----------------------///
app.listen(3000, () => {
    console.log("Server started. Listening to port 3000...");
});