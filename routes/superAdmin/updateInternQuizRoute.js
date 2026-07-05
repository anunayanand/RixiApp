const express = require("express");
const router = express.Router();
const authRole = require("../../middleware/authRole");
const updateInternQuizController = require("../../controllers/superAdmin/updateInternQuizController");
const validateRequest = require("../../middleware/validateRequest");
const { updateInternQuizSchema } = require("../../validations/superAdmin.validation");

router.post("/superAdmin/updateIntern/:id", authRole('superAdmin'), validateRequest(updateInternQuizSchema), updateInternQuizController.updateIntern);

module.exports = router;
