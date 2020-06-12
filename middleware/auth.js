const passportLocalMongoose = require("passport-local-mongoose");

const authMiddleware = {};

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        return res.redirect("/posts");
    }
}

authMiddleware.isLoggedIn = isLoggedIn;

module.exports = authMiddleware;