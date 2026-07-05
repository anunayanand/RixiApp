const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const changePasswordController = require('../../controllers/auth/changePasswordController');

router.post("/ambassador/change-password", changePasswordController.ambassadorChangePassword);

router.post("/intern/change-password", authRole(['admin','intern','superAdmin']), changePasswordController.internChangePassword);

module.exports = router;