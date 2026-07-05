const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const createInternController = require('../../controllers/admin/createInternController');

// =============================
// 👩‍🎓 CREATE INTERN (Admin Only)
// =============================
router.post("/create-user", authRole("admin"), createInternController.createIntern);

module.exports = router;
