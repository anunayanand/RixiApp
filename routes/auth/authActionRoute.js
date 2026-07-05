const express = require("express");
const router = express.Router();
const authController = require("../../controllers/auth/authController");
const loginLimiter = require("../../middleware/rateLimiter");
const validateRequest = require("../../middleware/validateRequest");
const { loginUserSchema } = require("../../validations/auth.validation");

router.post("/login", loginLimiter, validateRequest(loginUserSchema), authController.loginUser);
router.post("/org/login", loginLimiter, validateRequest(loginUserSchema), authController.loginOrg);
router.get("/logout", authController.logoutUser);

module.exports = router;
