const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Ambassador = require("../models/Ambassador");
const authRole = require("../middleware/authRole");

// Update Ambassador route
router.post(
  "/update-ambassador/:id",
  authRole("superAdmin"),
  async (req, res) => {
    try {
      const ambassador = await Ambassador.findById(req.params.id);
      if (!ambassador) {
        return res.json({ success: false, message: "Ambassador not found" });
      }

      const {
        ambassador_id,
        name,
        email,
        phone,
        college,
        university,
        designation,
        offer_letter_link,
        certificate_link,
        password,
        mail_sent,
        discountPercent,
      } = req.body;

      const existingAmbassador = await Ambassador.findById(req.params.id);

      let updateData = {
        ambassador_id,
        name,
        email,
        phone,
        college,
        university,
        designation,
        offer_letter_link,
        certificate_link,
        discountPercent: discountPercent ? Math.min(100, Math.max(0, parseInt(discountPercent))) : 0,
      };

      // Only hash if a new password is provided
      if (password && password.trim() !== "") {
        const isSamePassword = await bcrypt.compare(
          password,
          existingAmbassador.password
        );
        if (!isSamePassword) {
          updateData.password = await bcrypt.hash(password, 10);
          updateData.isFirstLogin = true;
        }
      }
      // Update mail sent status based on input
      if (mail_sent === "reset") {
        updateData.bronze_mail_sent = false;
        updateData.silver_mail_sent = false;
        updateData.gold_mail_sent = false;
      } else if (mail_sent) {
        if (mail_sent === "bronze") updateData.bronze_mail_sent = true;
        if (mail_sent === "silver") updateData.silver_mail_sent = true;
        if (mail_sent === "gold") updateData.gold_mail_sent = true;
      }

      await Ambassador.findByIdAndUpdate(req.params.id, updateData);

      return res.json({ success: true, message: "Ambassador Updated Successfully!" });
    } catch (err) {
      // console.error("Update Ambassador Error:", err);
      return res.json({ success: false, message: "Failed to update ambassador: " + err.message });
    }
  }
);

module.exports = router;
