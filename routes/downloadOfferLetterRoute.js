const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { generateOfferLetterPDF } = require("../services/pdfGenerator");
const authRole = require("../middleware/authRole");

router.get(
  "/download-offer-letter/:userId",
  authRole(["intern", "admin", "superAdmin"]),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).send("User not found");

      if (!user.starting_date)
        return res.status(400).send("Offer letter not available yet");

      const pdf = await generateOfferLetterPDF({
        name: user.name,
        domain: user.domain,
        duration: user.duration,
        intern_id: user.intern_id,
        starting_date: user.starting_date, // raw date
        college_name: user.college    // ✅ FIXED FIELD
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${user.name}_Offer_Letter_Rixi_Lab.pdf`
      );

      res.send(pdf);
    } catch (err) {
      console.error(err);
      res.status(500).send("Failed to generate offer letter");
    }
  }
);

module.exports = router;
