// routes/send-otpRoute.js
const express = require('express');
const router = express.Router();
const axios = require('axios');            
const User = require("../models/User");
const SCRIPT_URL = process.env.SCRIPT_URL;

router.post("/send-otp", async (req, res) => {
  const { intern_id, email, phone } = req.body;
//   console.log("POST /send-otp body:", req.body);

  if (!intern_id || !email || !phone) {
    req.flash("error", "All fields are required");
    return res.status(400).json({ success: false, msg: "All fields are required", flash: req.flash("error") });
  }

  if (!SCRIPT_URL) {
    // console.error("Missing SCRIPT_URL env var!");
    req.flash("error", "Server error: Missing SCRIPT_URL");
    return res.status(500).json({ success: false, msg: "Server misconfiguration", flash: req.flash("error") });
  }

  try {
    const user = await User.findOne({ intern_id, email, phone });

    if (!user) {
      req.flash("error", "User not found with provided details");
      return res.status(404).json({ success: false, msg: "User not found with provided details", flash: req.flash("error") });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    await user.save();

    // console.log("Generated OTP:", otp);

    await axios.post(SCRIPT_URL, { email, otp });

    req.flash("success", "OTP sent successfully!");
    return res.json({ success: true, msg: "OTP sent successfully", flash: req.flash("success") });

  } catch (err) {
    // console.error("Error in /send-otp:", err);
    req.flash("error", "Error sending OTP");
    return res.status(500).json({ 
      success: false, 
      msg: "Error sending OTP", 
      flash: req.flash("error"),
      error: err.message || err 
    });
  }
});

module.exports = router;
