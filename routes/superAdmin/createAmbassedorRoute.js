const express = require("express");
const router = express.Router();
const authRole = require("../../middleware/authRole");
const createAmbassadorController = require("../../controllers/superAdmin/createAmbassedorController");
const validateRequest = require("../../middleware/validateRequest");
const { createAmbassadorSchema } = require("../../validations/superAdmin.validation");

// =============================
// 👩‍🎓 CREATE AMBASSADOR (SuperAdmin Only)
// =============================
router.post(
  "/create-ambassador",
  authRole("superAdmin"),
  createAmbassadorController.upload.single("image"),
  validateRequest(createAmbassadorSchema),
  createAmbassadorController.createAmbassador
);

module.exports = router;
