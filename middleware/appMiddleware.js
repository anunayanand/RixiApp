const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const path = require("path");
const flash = require('connect-flash');

module.exports = function (app) {
  app.use(express.json());
  app.use(express.static("public"));
  app.use(express.json({ limit: '15mb' }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, "../public")));
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
  app.use("/bootstrap", express.static(path.join(__dirname, "../node_modules/bootstrap/dist")));

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "../views"));

  app.use(session({
    secret: process.env.SESSION_SECRET || "xjdshjsgbhbusguhiusgughiuhaiuhahah",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 80 * 60 * 1000 // 80 minutes in milliseconds
    }
  }));

  app.use(flash());
  
  // Make flash messages available in all templates
  app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.info = req.flash("info");
    next();
  });
};
