const express = require('express');
const router = express.Router();
require('dotenv').config();
const authRole = require('../../middleware/authRole');
const loginLimiter = require("../../middleware/rateLimiter");
const qrLoginController = require('../../controllers/auth/qrLoginController');

// 1. Setup QR Login (Generate Secret and QR Code for Google Auth)
// This endpoint requires the user to already be logged in (via normal email/password)
router.get("/qr-login/setup", authRole(["admin", "superAdmin"]), qrLoginController.setupQrLogin);

// 2. Confirm Setup (Verify the first TOTP code to finalize setup)
router.post("/qr-login/confirm-setup", authRole(["admin", "superAdmin"]), qrLoginController.confirmSetupQrLogin);

// 3. QR Login (Process the physical scan)
router.post("/qr-login", loginLimiter, qrLoginController.qrLogin);

module.exports = router;
