const express = require('express');
const router = express.Router();
const Ambassador = require("../models/Ambassador");
const User = require("../models/User"); // ✅ assuming interns are stored in User collection
const authRole = require('../middleware/authRole');
const bcrypt = require("bcrypt");

// 🏅 Ambassador Dashboard with referred interns and earnings
router.get("/ambassador", authRole("ambassador"), async (req, res) => {
  try {
    // 1️⃣ Fetch current ambassador
    const ambassador = await Ambassador.findById(req.session.user);
    if (!ambassador) {
      req.flash("error", "Ambassador not found");
      return res.redirect("/login");
    }

    // 2️⃣ Update badge automatically
    ambassador.updateBadge();
    ambassador.isOnline = true;
    await ambassador.save();
    

    // 3️⃣ Fetch interns referred by this ambassador
    const referredInterns = await User.find({ referal_code: ambassador.referralId , role: "intern" })
      .select("name email domain batch_no joining_date") // only required fields
      .lean();
     // Placeholder value
    ambassador.internCount = referredInterns.length;
    await ambassador.save();

    // 4️⃣ Calculate stats
    const totalReferred = referredInterns.length;
    const earnings = totalReferred * 20;

    // 5️⃣ Leaderboard (optional)
    const leaderboard = await Ambassador.find({}, { name: 1, email: 1, internCount: 1, _id: 0 })
      .sort({ internCount: -1 })
      .lean();

    // 6️⃣ Render dashboard
    res.render("ambassador", {
      ambassador,
      totalReferred,
      referredInterns,
      earnings,
      badge: ambassador.badge,
      leaderboard,
      showPasswordPopup: ambassador.isFirstLogin,
      bronzeMail: ambassador.bronze_mail_sent,
      silverMail: ambassador.silver_mail_sent,
      goldMail: ambassador.gold_mail_sent
    });

  } catch (err) {
    console.error("Error in /ambassador/dashboard:", err);
    req.flash("error", "Server error occurred");
    res.redirect("/login");
  }
});

module.exports = router;
