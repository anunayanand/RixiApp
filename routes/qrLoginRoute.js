const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { generateSignature } = require('./profileRoute');
const Admin = require('../models/Admin');
const SuperAdmin = require('../models/SuperAdmin');
const authRole = require('../middleware/authRole');
const loginLimiter = require("../middleware/rateLimiter");

// 1. Setup QR Login (Generate Secret and QR Code for Google Auth)
// This endpoint requires the user to already be logged in (via normal email/password)
router.get("/qr-login/setup", authRole(["admin", "superAdmin"]), async (req, res) => {
  try {
    const role = req.session.role;
    const userId = req.session.user;

    let user;
    if (role === "admin") user = await Admin.findById(userId);
    else if (role === "superAdmin") user = await SuperAdmin.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Generate a new secret for Google Authenticator
    const secret = speakeasy.generateSecret({
      name: `Rixi Lab (${role === 'superAdmin' ? 'SuperAdmin' : 'Admin'} - ${user.name})`
    });

    // Save the secret temporarily, but don't mark as setup until confirmed
    user.qrLoginSecret = secret.base32;
    await user.save();

    const qrDataURL = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      qrCodeImage: qrDataURL,
      secretBase32: secret.base32
    });

  } catch (err) {
    console.error("Error setting up QR login:", err);
    res.status(500).json({ success: false, message: "Server error configuring QR login setup." });
  }
});

// 2. Confirm Setup (Verify the first TOTP code to finalize setup)
router.post("/qr-login/confirm-setup", authRole(["admin", "superAdmin"]), async (req, res) => {
  try {
    const { token } = req.body;
    const role = req.session.role;
    const userId = req.session.user;

    if (!token) {
      return res.status(400).json({ success: false, message: "Verification code is required." });
    }

    let user;
    if (role === "admin") user = await Admin.findById(userId);
    else if (role === "superAdmin") user = await SuperAdmin.findById(userId);

    if (!user || !user.qrLoginSecret) {
      return res.status(400).json({ success: false, message: "QR Login setup not initialized." });
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.qrLoginSecret,
      encoding: "base32",
      token,
      window: 1 // Allow 30 seconds drift 
    });

    if (verified) {
      user.isQrLoginSetup = true;
      await user.save();
      return res.json({ success: true, message: "QR Login Setup configured successfully!" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code." });
    }

  } catch (err) {
    console.error("Error confirming QR login setup:", err);
    res.status(500).json({ success: false, message: "Server error verifying code." });
  }
});

// 3. QR Login (Process the physical scan)
router.post("/qr-login", loginLimiter, async (req, res) => {
  try {
    const { emp_id, sig } = req.body;

    if (!emp_id || !sig) {
      return res.status(400).json({
        success: false,
        message: "Missing emp_id or cryptographic signature. Please scan a valid ID."
      });
    }
    // Alias: Old card RL240901 → login as RL250201
    let resolvedEmpId = emp_id;
    let resolvedSig   = sig;
    if (emp_id === 'RL240901' && sig === 'dcf38d7462052150') {
      resolvedEmpId = 'RL250201';
      resolvedSig   = generateSignature('RL250201');
    }

    // 1. Verify HMAC Signature First
    const expectedSig = generateSignature(resolvedEmpId);
    if (resolvedSig !== expectedSig) {
      return res.status(403).json({
        success: false,
        message: "Cryptographic signature validation failed. This QR code is invalid or unauthorized."
      });
    }

    // 2. Find User
    let loginUser = null;
    let loginRole = null;

    const adminRecord = await Admin.findOne({ emp_id: resolvedEmpId });
    if (adminRecord) {
      loginUser = adminRecord;
      loginRole = "admin";
    } else {
      const superAdminRecord = await SuperAdmin.findOne({ emp_id: resolvedEmpId });
      if (superAdminRecord) {
        loginUser = superAdminRecord;
        loginRole = "superAdmin";
      }
    }

    if (!loginUser) {
      return res.status(404).json({
        success: false,
        message: "No user account is associated with this ID card."
      });
    }

    // 5. Success - Set Session
    req.session.user = loginUser._id;
    req.session.role = loginRole;

    req.flash("success", `Welcome, ${loginUser.name.trim()}! QR Login Successful.`);

    return res.json({
      success: true,
      redirect: loginRole === "superAdmin" ? "/superAdmin" : "/admin",
      message: "Login successful!"
    });

  } catch (err) {
    console.error("QR Login Error:", err);
    res.status(500).json({ success: false, message: "Something went wrong during QR Login." });
  }
});

module.exports = router;
