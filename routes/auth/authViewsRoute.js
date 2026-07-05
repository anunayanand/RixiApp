const express = require("express");
const router = express.Router();
const authViewsController = require("../../controllers/auth/authViewsController");

router.get("/login", authViewsController.getLogin);

router.get("/reset-password", authViewsController.getResetPassword);

router.get("/generate-captcha", authViewsController.generateCaptcha);

router.get("/admin-login", authViewsController.getAdminLogin);

router.get("/terms-and-conditions", authViewsController.getTermsAndConditions);

module.exports = router;
