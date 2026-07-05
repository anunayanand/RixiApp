const asyncHandler = require("../../utils/asyncHandler");

exports.getLogin = asyncHandler(async (req, res) => {
  const randomText = Math.random().toString(36).substring(2, 7).toUpperCase();
  req.session.captcha = randomText;
  res.render("login", { captchaText: randomText });
});

exports.getResetPassword = asyncHandler(async (req, res) => {
  res.render("resetPassword");
});

exports.generateCaptcha = asyncHandler(async (req, res) => {
  const newCaptcha = Math.random().toString(36).substring(2, 7).toUpperCase();
  req.session.captcha = newCaptcha;
  res.json({ captcha: newCaptcha });
});

exports.getAdminLogin = asyncHandler(async (req, res) => { 
  res.render("orgLogin", { messages: req.flash() });
});

exports.getTermsAndConditions = asyncHandler(async (req, res) => {
  res.render("termsAndConditions");
});
