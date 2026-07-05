const express = require("express");
const router = express.Router();
const verifyResetController = require('../../controllers/auth/verifyResetController');

router.post("/verify-reset", verifyResetController.verifyReset);

module.exports = router;
