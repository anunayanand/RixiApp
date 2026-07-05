const express = require("express");
const router = express.Router();
const internshipController = require("../../controllers/public/internshipController");

// Profile image upload endpoint
router.post("/upload-profile-image", internshipController.uploadProfile.single("profileImage"), internshipController.uploadProfileImage);

router.get("/get-price-info", internshipController.getPriceInfo);

router.post("/validate-referral", internshipController.validateReferral);

router.post("/create-order", internshipController.createOrder);

router.get("/payment/callback", internshipController.paymentCallback);

router.get("/receipt/:orderId", internshipController.getReceipt);

module.exports = router;
