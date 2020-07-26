const express = require("express");
const app = express();

const bodyParser = require('body-parser');

const mongoose = require("mongoose");
const User = require("./models/user");
const passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;

const session = require("cookie-session");
const methodOverride = require("method-override");

const feedRoutes = require("./routes/feed");
const commentCodepreciateRoutes = require("./routes/commentCodepreciate");
const miscRoutes = require("./routes/misc");
const problemsetRoutes = require("./routes/problemset");
const contestRoutes = require("./routes/contests");

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
mongoose.connect(process.env.DB_URI, {
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
app.use(contestRoutes);
app.use(miscRoutes);

///-----------------------///
///START SERVER
///-----------------------///

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, () => {
    //console.log("Server started. Listening to port 3000...");
});