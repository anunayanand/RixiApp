const express = require("express");
const router = express.Router();
const authRole = require("../../middleware/authRole");
const superAdminController = require("../../controllers/superAdmin/superAdminController");

router.get("/", authRole("superAdmin"), superAdminController.renderDashboard);
router.post("/registration/:id/:action", authRole("superAdmin"), superAdminController.approveOrRejectRegistration);
router.post("/send-offer-letter", authRole("superAdmin"), superAdminController.sendOfferLetter);
router.get("/mail-center", authRole("superAdmin"), superAdminController.renderMailCenter);
router.get("/report/batch/:batch_no", authRole("superAdmin"), superAdminController.renderBatchReport);
router.get("/receipt/:id", authRole("superAdmin"), superAdminController.downloadReceipt);

module.exports = router;

