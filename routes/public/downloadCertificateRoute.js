const express = require('express');
const router = express.Router();
const authRole = require("../../middleware/authRole");
const downloadCertificateController = require('../../controllers/public/downloadCertificateController');

router.get(
  "/download-certificate/:userId",
  authRole(['intern','admin','superAdmin']),
  downloadCertificateController.downloadCertificate
);

module.exports = router;