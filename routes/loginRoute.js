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

    // CAPTCHA valid only once
    req.session.captcha = null;

    // Fetch both user and ambassador (parallel)
    const [user, ambassador] = await Promise.all([
      User.findOne({ email }),
      Ambassador.findOne({ email }),
    ]);

    let userMatch = false;
    let ambassadorMatch = false;

    // 👤 Check User credentials
    if (user) {
      userMatch = await bcrypt.compare(password, user.password);

      if (userMatch) {
        req.session.user = user._id;
        req.session.role = user.role;

        if (user.role === "admin" || user.role === "superAdmin") {
          return res.redirect("/admin-login");
        }

        req.flash("success", `Welcome, ${user.name.trim()}!`);
        return res.redirect("/intern");
      }
    }

    // 🤝 Check Ambassador credentials
    if (ambassador) {
      ambassadorMatch = await bcrypt.compare(password, ambassador.password);

      if (ambassadorMatch) {
        req.session.user = ambassador._id;
        req.session.role = "ambassador";
        req.session.isFirstLogin = ambassador.isFirstLogin;

        req.flash("success", `Welcome, Ambassador ${ambassador.name.trim()}!`);
        return res.redirect("/ambassador");
      }
    }

    // 🚫 No match
    req.flash("error", "Invalid email address or password");
    return res.redirect("/login");

  } catch (err) {
    console.error("🔥 Login Error:", err);
    req.flash("error", "Something went wrong, please try again.");
    return res.redirect("/login");
  }
});

module.exports = router;
