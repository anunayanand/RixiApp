const express = require('express');
const router = express.Router();
const Ambassador = require("../models/Ambassador");
const authRole = require('../middleware/authRole');
const bcrypt = require("bcrypt");
const User = require("../models/User");


router.post("/ambassador/change-password",async (req, res) => {
  try {
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

    req.flash("success", "Password updated successfully. Please log in again.");
    res.redirect("/logout");

  } catch (err) {
    // console.error("Error changing password:", err);
    req.flash("error", "Server error while changing password.");
    res.redirect("/ambassador");
  }
});
router.post("/intern/change-password", authRole(['admin','intern','superAdmin']), async (req, res) => {
  try {
    // console.log("🔹 Intern password change route hit");
    // console.log("Session user:", req.session.user);

    const { newPassword, confirmPassword } = req.body;

    const intern = await User.findById(req.session.user);
    // console.log("🔹 Intern found:", intern ? intern.email : "No intern found");

    if (!intern) {
      // console.log("❌ Intern not found");
      req.flash("error", "Intern not found");
      return res.redirect("/login");
    }

    let redirectUrl = "/";
    if (intern.role === "intern") redirectUrl = "/intern";
    else if (intern.role === "admin") redirectUrl = "/admin";
    else if (intern.role === "superAdmin") redirectUrl = "/superAdmin";

    if (!newPassword || !confirmPassword) {
      // console.log("❌ Missing password fields");
      req.flash("error", "Please fill in all fields.");
     return res.redirect(redirectUrl);
    }

    if (newPassword !== confirmPassword) {
      // console.log("❌ Passwords do not match");
      req.flash("error", "Passwords do not match.");
      return res.redirect(redirectUrl);
    }

    if (newPassword.length < 6) {
      // console.log("❌ Password too short");
      req.flash("error", "Password must be at least 6 characters.");
     return res.redirect(redirectUrl);
    }

    // console.log("🔸 Hashing new password...");
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // console.log("🔸 Hash complete:", hashedPassword);

    intern.password = hashedPassword;
    intern.isFirstLogin = false;

    // console.log("🔸 Saving intern...");
    req.flash("success", "Password changed");
    await intern.save();
   

    res.redirect("/logout");
  } catch (err) {
    // console.error("❌ Error changing intern password:", err);
    req.flash("error", "Server error while changing password.");
    res.redirect("/intern");
  }
});

module.exports = router;