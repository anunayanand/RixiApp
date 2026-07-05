// routes/send-otpRoute.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const sendOtpController = require('../../controllers/auth/sendOtpController');

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  handler: (req, res, next, options) => {
    req.flash('error', options.message.msg);
    res.status(options.statusCode).json({
      success: false,
      msg: options.message.msg,
      flash: req.flash('error')
    });
  },
  message: { msg: "Too many OTP requests from this IP. Please try again after 5 minutes." }
});

router.post("/send-otp", otpLimiter, sendOtpController.sendOtp);

module.exports = router;
