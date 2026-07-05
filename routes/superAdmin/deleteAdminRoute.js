const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const deleteAdminController = require('../../controllers/superAdmin/deleteAdminController');

router.post("/delete-admin/:id", authRole("superAdmin"), deleteAdminController.deleteAdmin);

module.exports = router;
