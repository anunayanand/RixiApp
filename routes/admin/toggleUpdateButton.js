const express = require("express");
const router = express.Router();
const toggleUpdateButtonController = require("../../controllers/admin/toggleUpdateButtonController");

// Toggle visibility route
router.post("/project/toggle-visibility/:id", toggleUpdateButtonController.toggleProjectVisibility);

module.exports = router;
