const express = require("express");
const router = express.Router();

router.get("/login", (req, res) => {
  const randomText = Math.random().toString(36).substring(2, 7).toUpperCase();
  req.session.captcha = randomText;
  res.render("login", { captchaText: randomText });
});

router.get("/reset-password", (req, res) => {
  res.render("resetPassword");
});

router.get("/generate-captcha", (req, res) => {
  const newCaptcha = Math.random().toString(36).substring(2, 7).toUpperCase();
  req.session.captcha = newCaptcha;
  res.json({ captcha: newCaptcha });
});

router.get("/admin-login", (req, res) => { 
  res.render("orgLogin", { messages: req.flash() });
});

router.get("/terms-and-conditions", (req, res) => {
  res.render("termsAndConditions");
});

module.exports = router;
