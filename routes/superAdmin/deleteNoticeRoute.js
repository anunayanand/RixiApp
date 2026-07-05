const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const deleteNoticeController = require('../../controllers/superAdmin/deleteNoticeController');

// Delete a notice (SuperAdmin only)
router.post('/notice/delete/:index', authRole('superAdmin'), deleteNoticeController.deleteNotice);

module.exports = router;
