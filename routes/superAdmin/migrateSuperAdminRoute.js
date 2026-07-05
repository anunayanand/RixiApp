const express = require('express');
const router = express.Router();
const migrateSuperAdminController = require('../../controllers/superAdmin/migrateSuperAdminController');

// Migration route - run this once to migrate superadmin from User to SuperAdmin collection
router.get("/migrate-superadmin", migrateSuperAdminController.migrateSuperAdmin);

module.exports = router;
