const express = require('express');
const router = express.Router();
const verifyCertificateController = require('../../controllers/public/verifyCertificateController');

// Certificate Verification Route
router.post("/verify-certificate", verifyCertificateController.verifyCertificate);

// Bootcamp Certificate Verification Route (for QR Code)
router.get("/verify-bootcamp-certificate/:certificate_id", verifyCertificateController.verifyBootcampCertificate);

module.exports = router;