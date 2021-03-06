// PACKAGES ==========================================
var path = require("path");
var express = require("express");
var mongoose = require("mongoose");
var passport = require("passport");
var localStrategy = require("passport-local");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var expressSession = require("express-session");
var morgan = require("morgan");
var bcrypt = require("bcryptjs");
var flash = require("connect-flash");

// SETUP ==========================================
var app = express();
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(morgan("combined"));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressSession({ secret: "express session secret xd", resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/social_network", {
    keepAlive: true,
    reconnectTries: Number.MAX_VALUE,
    useMongoClient: true
});

// USER MODEL ==========================================
var userSchema = mongoose.Schema({
    email: String,
    password: String,
});

var User = mongoose.model("User", userSchema);

// PASSPORT ==========================================

// serialization
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

// signup
passport.use("local-signup", new localStrategy({
    usernameField: "email",
    passwordField: "password",
    passReqToCallback: true
},
function(req, email, password, done) {
    process.nextTick(() => {
        User.findOne({"email": email}, (err, user) => {
            if (err) return done(err);
            if (user) {
                return done(null, false, req.flash("signupMessage", "<div class='alert alert-danger'>Email already in use.</div>"));
            } else {
                var newUser = new User();

                newUser.email = email;
                newUser.password = bcrypt.hashSync(password, 8);
                console.log(newUser.password);

                newUser.save((err) => {
                    if (err) throw err;
                    return done(null, newUser, req.flash("signupMessage", "<div class='alert alert-success'>Success! Created account successfully. <a href='/login'>Log in</a> here</div>"));
                });
            }

        });
    });
}

));

// log in
passport.use("local-login", new localStrategy({
    usernameField: "email",
    passwordField: "password",
    passReqToCallback: true
},

function(req, email, password, done) {
    User.findOne({"email": email}, (err, user) => {
        if (err) return done(err);
        if (!user) return done(null, false, req.flash("loginMessage", "<div class='alert alert-danger'>Username or password incorrect.</div>"));

        if (!bcrypt.compareSync(password, user.password)) return done(null, false, req.flash("loginMessage", "<div class='alert alert-danger'>Username or password incorrect.</div>"));

        return done(null, user, req.flash("loginMessage", "<div class='alert alert-success'>Login successful! </div>"));
    });
}

));


// ROUTES ==========================================
app.get("/", (req, res) => {
    res.render("index.ejs");
});

app.get("/signup", (req, res) => {
    res.render("signup.ejs", {message: req.flash("signupMessage")});
});

app.post("/signup", passport.authenticate("local-signup", {
    successRedirect: "/signup",
    failureRedirect: "/signup",
    failureFlash: true
}));

app.get("/login", (req, res) => {
    res.render("login.ejs", {message: req.flash("loginMessage")});
});

app.post("/login", passport.authenticate("local-login", {
    successRedirect: "/login",
    failureRedirect: "/login",
    failureFlash: true
}));

// START SERVER ==========================================
app.listen(3000, () => {
    console.log("Server started on port 3000");
});
