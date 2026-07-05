const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const noticeController = require('../../controllers/superAdmin/noticeController');

// Add a notice (SuperAdmin only)
router.post('/notice', authRole('superAdmin'), noticeController.addNotice);

module.exports = router;