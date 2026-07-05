const express = require("express");
const router = express.Router();
const authRole = require("../../middleware/authRole");
const adminController = require("../../controllers/admin/adminController");

router.get("/", authRole("admin"), adminController.getAdminDashboard);

// Accept registration and create user
router.post("/accept-registration/:id", authRole("admin"), adminController.acceptRegistration);

// Update Admin Profile Settings
router.post("/update-admin-profile", authRole("admin"), adminController.updateAdminProfile);

// Admin requests PF withdrawal
router.post("/request-pf-withdrawal", authRole("admin"), adminController.requestPfWithdrawal);

// Admin downloads salary slip
router.get("/download-salary-slip/:slipIndex", authRole("admin"), adminController.downloadSalarySlip);

// Admin downloads PF slip
router.get("/download-pf-slip/:slipIndex", authRole("admin"), adminController.downloadPfSlip);

module.exports = router;
