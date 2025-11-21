const express = require('express');
const router = express.Router();
const Ambassador = require("../models/Ambassador");
const authRole = require('../middleware/authRole');
const User = require("../models/User");

// SuperAdmin view of a specific Ambassador
router.get("/superAdmin/ambassador/:ambassadorId", authRole("superAdmin"), async (req, res) => {
  try {
    const ambassador = await Ambassador.findById(req.params.ambassadorId);
    if (!ambassador || ambassador.role !== "ambassador") {
      req.flash("error", "Ambassador not found");
      return res.redirect("/superAdmin");
    }

    // Fetch interns referred by this ambassador
    // Assuming User schema has a field storing the referralId used during registration
   const referredInterns = await User.find({ referral_id: ambassador.referralId , role: "intern" })
         .select("name email domain batch_no joining_date") // only required fields
         .lean();

    // Fetch other useful info if needed
   const totalReferred = referredInterns.length;
    const earnings = totalReferred * 20;
    const badge = ambassador.badge;
    const leaderboard = await Ambassador.find({}, { name: 1, email: 1, internCount: 1, _id: 0 })
        .sort({ internCount: -1 })
        .lean();
    const showPasswordPopup = false;
    req.flash('info', `Viewing Ambassador: ${ambassador.name}`);
    res.render("ambassador", { 
      ambassador, 
      totalReferred ,
      referredInterns,
      earnings, 
      badge ,
      leaderboard,
      showPasswordPopup,
      bronzeMail: ambassador.bronze_mail_sent,
      silverMail: ambassador.silver_mail_sent,
      goldMail: ambassador.gold_mail_sent
    });

  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong");
    res.redirect("/superAdmin");
  }
});

module.exports = router;
