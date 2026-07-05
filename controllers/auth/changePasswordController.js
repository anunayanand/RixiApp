const Ambassador = require("../../models/Ambassador");
const bcrypt = require("bcrypt");
const User = require("../../models/User");
const asyncHandler = require("../../utils/asyncHandler");

exports.ambassadorChangePassword = asyncHandler(async (req, res) => {
  const { newPassword, confirmPassword } = req.body;
  const ambassador = await Ambassador.findById(req.session.user);

  if (!ambassador) {
    req.flash("error", "Ambassador not found");
    return res.redirect("/login");
  }

  if (!newPassword || !confirmPassword) {
    req.flash("error", "Please fill in all fields.");
    return res.redirect("/ambassador");
  }

  if (newPassword !== confirmPassword) {
    req.flash("error", "Passwords do not match.");
    return res.redirect("/ambassador");
  }

  if (newPassword.length < 6) {
    req.flash("error", "Password must be at least 6 characters.");
    return res.redirect("/ambassador");
  }

  ambassador.password = await bcrypt.hash(newPassword, 10);
  ambassador.isFirstLogin = false;
  await ambassador.save();

  req.flash("success", "Password Changed");
  res.redirect("/ambassador");
});

exports.internChangePassword = asyncHandler(async (req, res) => {
  const { newPassword, confirmPassword } = req.body;

  const intern = await User.findById(req.session.user);

  if (!intern) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(404).json({ success: false, message: "Intern not found" });
    }
    req.flash("error", "Intern not found");
    return res.redirect("/login");
  }

  let redirectUrl = "/";
  if (intern.role === "intern") redirectUrl = "/intern";
  else if (intern.role === "admin") redirectUrl = "/admin";
  else if (intern.role === "superAdmin") redirectUrl = "/superAdmin";

  if (!newPassword || !confirmPassword) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, message: "Please fill in all fields." });
    }
    req.flash("error", "Please fill in all fields.");
    return res.redirect(redirectUrl);
  }

  if (newPassword !== confirmPassword) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }
    req.flash("error", "Passwords do not match.");
    return res.redirect(redirectUrl);
  }

  if (newPassword.length < 6) {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    }
    req.flash("error", "Password must be at least 6 characters.");
    return res.redirect(redirectUrl);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  intern.password = hashedPassword;
  intern.isFirstLogin = false;

  await intern.save();
 
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.json({ success: true, message: "Password changed successfully!" });
  }

  req.flash("success", "Password Changed");
  res.redirect(redirectUrl);
});
