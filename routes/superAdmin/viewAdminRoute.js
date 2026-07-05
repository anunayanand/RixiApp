const express = require("express");
const router = express.Router();
const authRole = require("../../middleware/authRole");
const viewAdminController = require("../../controllers/superAdmin/viewAdminController");

// ==========================================
// 🔹 SUPERADMIN VIEWING SPECIFIC ADMIN
// ==========================================
router.get(
  "/superAdmin/admin/:adminId",
  authRole("superAdmin"),
  viewAdminController.viewAdmin
);

module.exports = router;