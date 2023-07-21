require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));

// express-session middleware is set up with initial configuration options
app.use(session({
    secret: "our little secret.", // A string used to sign the session ID cookie
    resave: false, // Specifies whether the session should be saved to the store on each request
    saveUninitialized: false // Specifies whether a session should be saved if it's new and has not been modified
}));

//  passport is initialized and used as middleware in the Express app
app.use(passport.initialize());
// passport.session() is used to enable Passport to manage sessions
app.use(passport.session());

main().catch((err) => console.log(err));

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/userDB");

    const userSchema = new mongoose.Schema({
        email: String,
        password: String
    });

    // we're going to save our users into mongodb database
    userSchema.plugin(passportLocalMongoose);

    const User = mongoose.model("User", userSchema);

    // passport.use() sets up the local strategy, which is using the passportLocalMongoose method to authenticate users based on their email and password
    passport.use(User.createStrategy());

    // manage user sessions
    passport.serializeUser(User.serializeUser()); // store a user in the session
    passport.deserializeUser(User.deserializeUser()); // retrieve a user from the session

    app.get("/", (req, res) => {
        res.render("home");
    });

    app.get("/login", (req, res) => {
        res.render("login");
    });

    app.get("/register", (req, res) => {
        res.render("register");
    });

    app.get("/secrets", (req, res) => {
        if (req.isAuthenticated()) {
            res.render("secrets");
        } else {
            res.redirect("/login");
        }
    });

    app.get("/logout", (req, res) => {
        req.logout(function (err) {
            if (err) {
                return next(err);
            }
            res.redirect('/');
        });
    })

    app.post("/register", (req, res) => {
        User.register({
            username: req.body.username
        }, req.body.password, () => {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                });
            }
        });
    });

    app.post("/login", (req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password,
        });

        req.login(user, (err) => {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, function () {
                    res.redirect("/secrets");
                });
            }
        });
    });


    app.listen(3000, () => {
        console.log("Server's running on port 3000");
    });
}