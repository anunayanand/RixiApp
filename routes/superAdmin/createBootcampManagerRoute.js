const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const createBootcampManagerController = require('../../controllers/superAdmin/createBootcampManagerController');
const validateRequest = require("../../middleware/validateRequest");
const { createBootcampManagerSchema } = require("../../validations/superAdmin.validation");

// =============================
// 👨‍🏫 CREATE BOOTCAMP MANAGER (SuperAdmin Only)
// =============================
router.post("/create-bootcamp-manager", authRole("superAdmin"), createBootcampManagerController.upload.single("image"), validateRequest(createBootcampManagerSchema), createBootcampManagerController.createBootcampManager);

module.exports = router;
