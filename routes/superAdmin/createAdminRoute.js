const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const createAdminController = require('../../controllers/superAdmin/createAdminController');
const validateRequest = require('../../middleware/validateRequest');
const { createAdminSchema } = require('../../validations/superAdmin.validation');

// =============================
// 👨‍💼 CREATE ADMIN (SuperAdmin Only)
// =============================
router.post("/create-admin", authRole("superAdmin"), createAdminController.upload.single("image"), validateRequest(createAdminSchema), createAdminController.createAdmin);

module.exports = router;
