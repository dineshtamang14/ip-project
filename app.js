require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/user-profiles", {useNewUrlParser: true});

const userSechema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
});

userSechema.plugin(passportLocalMongoose);
userSechema.plugin(findOrCreate);

const User = new mongoose.model("User", userSechema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

app.get("/", (req, res)=>{
    res.render("login");
});

app.get("/home", (req, res)=>{
    User.find({"secret": {$ne: null}}, function(err, foundUser){
        if(err){
            console.log(err);
        } else {
            if(foundUser){
                res.render("index", {userWithSecrets: foundUser});
            }
        }
    });
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

app.get("/:routs", (req, res)=>{
    const goto = req.params.routs;
    res.render(goto);
});

app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password,
    });

    req.login(user, function(err){
        if(!err){
            passport.authenticate("local")(req, res, function(){
                res.redirect("/index");
            });
        } else {
            console.log(err);
        }
    })
});


app.post("/register", function(req, res){
    User.register({username: req.body.username, email: req.body.email}, req.body.password, function(err, user){
        if(!err){
            passport.authenticate("local")(req, res, function(){
                res.redirect("/index");
            });
        } else {
            console.log(err);
            res.redirect("/login");
        }
    });
});



const port = process.env.PORT || 3000;
app.listen(port, ()=>{
    console.log(`server is running on ${port}`);
});