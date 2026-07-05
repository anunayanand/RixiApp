const express = require("express");
const router = express.Router();
const authRole = require("../../middleware/authRole");
const updateAmbassadorController = require("../../controllers/superAdmin/updateAmbassadorController");
const validateRequest = require("../../middleware/validateRequest");
const { updateAmbassadorSchema } = require("../../validations/superAdmin.validation");

// Update Ambassador route
router.post(
  "/update-ambassador/:id",
  authRole("superAdmin"),
  validateRequest(updateAmbassadorSchema),
  updateAmbassadorController.updateAmbassador
);

module.exports = router;
