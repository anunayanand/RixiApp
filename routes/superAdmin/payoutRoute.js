const express = require("express");
const router = express.Router();
const authRole = require("../../middleware/authRole");
const payoutController = require("../../controllers/superAdmin/payoutController");

router.get("/payouts", authRole("superAdmin"), payoutController.renderPayoutCenter);
router.post("/payouts/expenditure", authRole("superAdmin"), payoutController.addExpenditure);
router.post("/payouts/verify-secret", authRole("superAdmin"), payoutController.verifySecret);
router.post("/payouts/set-secret", authRole("superAdmin"), payoutController.setSecret);
router.post("/payouts/reset-secret", authRole("superAdmin"), payoutController.resetSecret);
router.post("/payouts/ambassador/approve/:txId", authRole("superAdmin"), payoutController.approveAmbassadorPayout);
router.post("/payouts/ambassador/reject/:txId", authRole("superAdmin"), payoutController.rejectAmbassadorPayout);
router.post("/payouts/admin/update-payroll/:adminId", authRole("superAdmin"), payoutController.updateAdminPayroll);
router.post("/payouts/admin/settle/:adminId", authRole("superAdmin"), payoutController.settleAdminSalary);
router.post("/payouts/admin/pf-approve/:adminId/:pfId", authRole("superAdmin"), payoutController.approveAdminPf);
router.post("/payouts/admin/pf-reject/:adminId/:pfId", authRole("superAdmin"), payoutController.rejectAdminPf);
router.get("/payouts/history", authRole("superAdmin"), payoutController.getPayoutHistory);
router.get("/payouts/download-slip/:adminId/:slipIndex", authRole("superAdmin"), payoutController.downloadSalarySlip);
router.post("/payouts/intern/approve-redemption/:id", authRole("superAdmin"), payoutController.approveInternRedemption);
router.post("/payouts/intern/reject-redemption/:id", authRole("superAdmin"), payoutController.rejectInternRedemption);

module.exports = router;
