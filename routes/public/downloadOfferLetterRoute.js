const express = require("express");
const router = express.Router();
const authRole = require("../../middleware/authRole");
const downloadOfferLetterController = require("../../controllers/public/downloadOfferLetterController");

router.get(
  "/download-offer-letter/:userId",
  authRole(["intern", "admin", "superAdmin"]),
  downloadOfferLetterController.downloadOfferLetter
);

module.exports = router;
