const express = require("express");
const router = express.Router();
const authRole = require("../../middleware/authRole");
const updateProjectController = require("../../controllers/admin/updateProjectController");

// Update Project
router.post("/admin/project/update/:id", authRole("admin"), updateProjectController.updateProject);

module.exports = router;