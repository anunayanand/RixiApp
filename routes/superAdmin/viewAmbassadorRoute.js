const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const viewAmbassadorController = require("../../controllers/superAdmin/viewAmbassadorController");

// SuperAdmin view of a specific Ambassador
router.get("/superAdmin/ambassador/:ambassadorId", authRole("superAdmin"), viewAmbassadorController.viewAmbassador);

module.exports = router;
