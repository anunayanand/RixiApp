const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const viewInternController = require('../../controllers/admin/viewInternController');

router.get("/admin/intern/:internId", authRole(['admin','superAdmin']), viewInternController.viewIntern);

module.exports = router;
