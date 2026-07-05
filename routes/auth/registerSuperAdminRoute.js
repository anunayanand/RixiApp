const express = require('express');
const router = express.Router();
const registerSuperAdminController = require('../../controllers/auth/registerSuperAdminController');

// Register first superAdmin (disabled by default)
// router.get("/register-superAdmin", async (req, res) => { ... });

router.post("/register-superAdmin", registerSuperAdminController.postRegisterSuperAdmin);

module.exports = router;
