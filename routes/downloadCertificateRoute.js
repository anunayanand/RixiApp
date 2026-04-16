const express = require('express');
const router = express.Router();
const User = require("../models/User");
const { generateCertificatePDF } = require("../services/pdfGenerator");
const authRole = require("../middleware/authRole");

router.get("/download-certificate/:userId", authRole(['intern','admin','superAdmin']),async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).send("User not found");

  if (!user.feedbackSubmitted) {
    return res.status(403).send("Please submit your internship feedback before downloading the certificate.");
  }

  if (user.isPassed) {
    if (!user.completion_date) {
      return res.status(400).send("Certificate not available yet.");
    }
  } else {
    if (!user.certificatePurchased) {
      return res.status(400).send("Certificate not available. Payment is required as you have not passed the quiz.");
    }
    if (!user.completion_date) {
      return res.status(400).send("Certificate not available yet.");
    }
  }

  if (user.certificate_id && String(user.certificate_id).startsWith("TEMP")) {
    return res.status(400).send("Certificate is not valid yet. Please wait for final approval.");
  }

  function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const ordinal = (day) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    return `${day}${ordinal(day)} ${month} ${year}`;
  }

  const completionDate = formatDate(user.completion_date);
  const startingDate = formatDate(user.starting_date);

  const pdf = await generateCertificatePDF({
    name: user.name,
    intern_id: user.intern_id,
    certificate_id: user.certificate_id,
    domain: user.domain,
    duration: user.duration,
    starting_date: startingDate,
    completion_date: completionDate,
    internship_type : user.internshipType
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${user.name}_Internship_Certificate_Rixi_Lab.pdf`
  );

  res.send(pdf);
});

module.exports = router;