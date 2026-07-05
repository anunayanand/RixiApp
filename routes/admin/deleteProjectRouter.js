const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const deleteProjectController = require('../../controllers/admin/deleteProjectController');

router.post("/delete-project/:id", authRole("admin"), deleteProjectController.deleteProject);

module.exports = router;
