const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const viewInternController = require('../../controllers/admin/viewInternController');

router.get("/admin/intern/:internId", authRole(['admin','superAdmin']), viewInternController.viewIntern);
router.get("/admin/intern/:internId/download-receipt", authRole(['admin','superAdmin']), viewInternController.downloadInternReceipt);

module.exports = router;
