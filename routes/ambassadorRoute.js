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
    

    // 3️⃣ Fetch interns referred by this ambassador from the stored array
    const referredInterns = ambassador.referred_interns || [];
    
    ambassador.internCount = referredInterns.length;
    await ambassador.save();

    // 4️⃣ Calculate stats
    const totalReferred = ambassador.internCount;
    const earnings = ambassador.total_earnings || 0;

    // Calculate withdrawal stats
    const withdrawals = ambassador.withdrawals || [];
    const totalWithdrawn = withdrawals
      .filter(w => w.status == "Approved")
      .reduce((sum, w) => sum + w.amount, 0);
    const availableBalance = Math.max(0, earnings - totalWithdrawn);

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
      availableBalance,
      totalWithdrawn,
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

// 💸 Request a withdrawal
router.post("/ambassador/withdraw", authRole("ambassador"), async (req, res) => {
  try {
    const { amount, paymentDetails } = req.body;

    if (!amount || !paymentDetails) {
      return res.status(400).json({ success: false, message: "Amount and payment details are required." });
    }

    const withdrawAmount = Number(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ success: false, message: "Please enter a valid positive amount." });
    }

    const ambassador = await Ambassador.findById(req.session.user);
    if (!ambassador) {
      return res.status(404).json({ success: false, message: "Ambassador not found." });
    }

    // Double check badge status - only Bronze level or higher can withdraw
    if (ambassador.badge === "None") {
      return res.status(400).json({ success: false, message: "Withdrawals are only unlocked at Bronze badge level or higher." });
    }

    // Calculate current available balance
    const earnings = ambassador.total_earnings || 0;
    const totalWithdrawn = (ambassador.withdrawals || [])
      .filter(w => w.status !== "Rejected")
      .reduce((sum, w) => sum + w.amount, 0);
    const availableBalance = Math.max(0, earnings - totalWithdrawn);

    if (withdrawAmount > availableBalance) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Available: ₹${availableBalance}` });
    }

    // Add withdrawal request
    ambassador.withdrawals.push({
      amount: withdrawAmount,
      paymentDetails,
      status: "Pending",
      date: new Date()
    });

    await ambassador.save();

    return res.json({
      success: true,
      message: "Withdrawal request submitted successfully!",
      withdrawals: ambassador.withdrawals
    });

  } catch (err) {
    console.error("Error in /ambassador/withdraw:", err);
    return res.status(500).json({ success: false, message: "Server error while processing withdrawal." });
  }
});

module.exports = router;
