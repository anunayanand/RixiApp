const express = require('express');
const router = express.Router();
const projectStatusController = require('../../controllers/admin/projectStatusController');

router.post('/projects/update-status', projectStatusController.updateProjectStatus);

module.exports = router;
