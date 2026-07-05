const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const uploadProjectController = require('../../controllers/admin/uploadProjectController');

router.post("/admin/projects", authRole("admin"), uploadProjectController.uploadProject);

module.exports = router;
