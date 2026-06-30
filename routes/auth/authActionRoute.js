const express = require("express");
const router = express.Router();
const authController = require("./authController");
const loginLimiter = require("../../middleware/rateLimiter");

router.post("/login", loginLimiter, authController.loginUser);
router.post("/org/login", loginLimiter, authController.loginOrg);
router.get("/logout", authController.logoutUser);

module.exports = router;
