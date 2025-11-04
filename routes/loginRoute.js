const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Ambassador = require("../models/Ambassador");
const loginLimiter = require("../middleware/rateLimiter");

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password, captchaInput } = req.body;

    // 🔒 Verify CAPTCHA
    if (!captchaInput || captchaInput.toLowerCase() !== (req.session.captcha || "").toLowerCase()) {
      req.flash("error", "Invalid CAPTCHA. Please try again.");
      return res.redirect("/login");
    }

    // Clear CAPTCHA so it’s valid only once
    req.session.captcha = null;

    // ✅ Check User collection
    const user = await User.findOne({ email });
    if (user) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        req.flash("error", "Invalid email address or password");
        return res.redirect("/login");
      }

      // Save session
      req.session.user = user._id;
      req.session.role = user.role;

      // 🔹 Redirect based on role
      if (user.role === "admin" || user.role === "superAdmin") {
        // No flash message for admins or superadmins
        return res.redirect("/organizer-login");
      }

      // ✅ Intern only: show success flash
      req.flash("success", `Welcome, ${user.name.trim()}!`);
      return res.redirect("/intern");
    }

    // ✅ Check Ambassador collection
    const ambassador = await Ambassador.findOne({ email });
    if (ambassador) {
      const match = await bcrypt.compare(password, ambassador.password);
      if (!match) {
        req.flash("error", "Invalid email address or password");
        return res.redirect("/login");
      }

      req.session.user = ambassador._id;
      req.session.role = "ambassador";
      req.session.isFirstLogin = ambassador.isFirstLogin;

      req.flash("success", `Welcome, Ambassador ${ambassador.name.trim()}!`);
      return res.redirect("/ambassador");
    }

    // ❌ No user found
    req.flash("error", "Invalid email address or password");
    return res.redirect("/login");

  } catch (err) {
    console.error("🔥 Login Error:", err);
    req.flash("error", "Something went wrong, please try again.");
    res.redirect("/login");
  }
});

module.exports = router;
