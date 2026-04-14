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

    req.flash("success", "Password Changed");
    res.redirect("/ambassador");

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
      // console.log("❌ Missing password fields");
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, message: "Please fill in all fields." });
      }
      req.flash("error", "Please fill in all fields.");
     return res.redirect(redirectUrl);
    }

    if (newPassword !== confirmPassword) {
      // console.log("❌ Passwords do not match");
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, message: "Passwords do not match." });
      }
      req.flash("error", "Passwords do not match.");
      return res.redirect(redirectUrl);
    }

    if (newPassword.length < 6) {
      // console.log("❌ Password too short");
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
      }
      req.flash("error", "Password must be at least 6 characters.");
     return res.redirect(redirectUrl);
    }

    // console.log("🔸 Hashing new password...");
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // console.log("🔸 Hash complete:", hashedPassword);

    intern.password = hashedPassword;
    intern.isFirstLogin = false;

    // console.log("🔸 Saving intern...");
    await intern.save();
   
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, message: "Password changed successfully!" });
    }

    req.flash("success", "Password Changed");
    res.redirect(redirectUrl);
  } catch (err) {
    // console.error("❌ Error changing intern password:", err);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ success: false, message: "Server error while changing password." });
    }
    req.flash("error", "Server error while changing password.");
    res.redirect("/intern");
  }
});

module.exports = router;