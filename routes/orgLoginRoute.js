const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
const SuperAdmin = require("../models/SuperAdmin");
const loginLimiter = require("../middleware/rateLimiter");

router.post("/org/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Check if admin or superAdmin exists (parallel)
    const [admin, superAdmin] = await Promise.all([
      Admin.findOne({ email }),
      SuperAdmin.findOne({ email }),
    ]);

    let userMatch = null;

    // 👨‍💼 Check Admin credentials
    if (admin) {
      const match = await bcrypt.compare(password, admin.password);
      if (match) {
        userMatch = { user: admin, role: "admin" };
      }
    }

    // 👨‍💼 Check SuperAdmin credentials
    if (superAdmin && !userMatch) {
      const match = await bcrypt.compare(password, superAdmin.password);
      if (match) {
        userMatch = { user: superAdmin, role: "superAdmin" };
      }
    }

    if (!userMatch) {
      req.flash("error", "Invalid email address or password");
      return res.redirect("/admin-login");
    }

    // ✅ Save session
    req.session.user = userMatch.user._id;
    req.session.role = userMatch.role;

    // ✅ Role-based redirects
    if (userMatch.role === "admin") {
      req.flash("success", `Welcome, ${userMatch.user.name.trim()}!`);
      return res.redirect("/admin");
    } else if (userMatch.role === "superAdmin") {
      req.flash("success", `Welcome, ${userMatch.user.name.trim()}!`);
      return res.redirect("/superAdmin");
    }

  } catch (err) {
    console.error("🔥 Organizer Login Error:", err);
    req.flash("error", "Something went wrong, please try again.");
    return res.redirect("/admin-login");
  }
});

module.exports = router;
