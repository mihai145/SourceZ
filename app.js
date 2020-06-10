const express = require("express");
const app = express();

///-----------------------///
///APP SETUP
///-----------------------///
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/bootstrap"));

///-----------------------///
///ROOT
///-----------------------///
app.get("/", (req, res) => {
    res.render("root.ejs");
})

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