require("dotenv").config();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const hbs = require("hbs");
const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const cors = require("cors");

const User = require("./models/user.model");

// DB Setup
mongoose.Promise = Promise;
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected to Mongo!");
  })
  .catch(err => {
    console.error("Error connecting to mongo", err);
  });
// DB Setup

const app_name = require("./package.json").name;
const debug = require("debug")(
  `${app_name}:${path.basename(__filename).split(".")[0]}`
);

// Middleware Setup
app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(cookieParser());

app.use(
  session({
    secret: "our-passport-local-strategy-app",
    resave: true,
    saveUninitialized: true
  })
);

app.use(cors());

// PASSPORT CONFIG
passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) {
      return cb(err);
    }
    cb(null, user);
  });
});

passport.use(
  new LocalStrategy(
    {
      passReqToCallback: true
    },
    (req, username, password, next) => {
      User.findOne(
        {
          username
        },
        (err, user) => {
          if (err) {
            return next(err);
          }
          if (!user) {
            return next(null, false, {
              message: "Incorrect username"
            });
          }
          if (!bcrypt.compareSync(password, user.password)) {
            return next(null, false, {
              message: "Incorrect password"
            });
          }

          return next(null, user);
        }
      );
    }
  )
);

app.use(passport.initialize());
app.use(passport.session());
// PASSPORT CONFIG

//routes
const auth = require("./routes/auth.router");
app.use("/api", auth);
const job = require("./routes/job.router");
app.use("/api/job", job);
//routes

//start server
app.listen(process.env.PORT || 8080, () => {
  console.log(`Listening on http://localhost:${process.env.PORT}`);
});
// start server

module.exports = app;
