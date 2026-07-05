const express = require("express");
const router = express.Router();
const forgotPasswordController = require("../../controllers/auth/forgotPasswordController");

// 🧠 1. Setup 2FA (One-time setup by SuperAdmin)
router.get("/setup-2fa", forgotPasswordController.setup2FA);

// 🧠 2. Forgot Password — Request
router.get("/forgot-password", forgotPasswordController.getForgotPassword);

router.post("/forgot-password", forgotPasswordController.postForgotPassword);

// 🧠 3. Verify 2FA Code before allowing reset
router.post("/verify-2fa", forgotPasswordController.verify2FA);

// 🧠 4. Reset password after 2FA verified
router.post("/reset-password", forgotPasswordController.postResetPassword);

module.exports = router;
