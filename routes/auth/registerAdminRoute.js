const express = require('express');
const router = express.Router();
const registerAdminController = require('../../controllers/auth/registerAdminController');

// Register first admin
router.get("/register-admin", registerAdminController.getRegisterAdmin);

router.post("/register-admin", registerAdminController.postRegisterAdmin);

module.exports = router;
