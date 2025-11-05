const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const loginLimiter = require("../middleware/rateLimiter");

router.post("/org/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      req.flash("error", "Invalid email address or password");
      return res.redirect("/admin-login");
    }

    // ✅ Validate password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.flash("error", "Invalid email address or password");
      return res.redirect("/admin-login");
    }

    // ✅ Block interns from logging in here
    if (user.role === "intern") {
      req.flash("error", "Access denied. Please use the regular login page.");
      return res.redirect("/login");
    }

    // ✅ Save session
    req.session.user = user._id;
    req.session.role = user.role;

    // ✅ Role-based redirects
    if (user.role === "admin") {
      req.flash("success", `Welcome, ${user.name.trim()}!`);
      return res.redirect("/admin");
    } else if (user.role === "superAdmin") {
      req.flash("success", `Welcome, ${user.name.trim()}!`);
      return res.redirect("/superAdmin");
    } else {
      req.flash("error", "Access denied. Invalid role for organizer login.");
      return res.redirect("/login");
    }

  } catch (err) {
    console.error("🔥 Organizer Login Error:", err);
    req.flash("error", "Something went wrong, please try again.");
    return res.redirect("/admin-login");
  }
});

module.exports = router;
