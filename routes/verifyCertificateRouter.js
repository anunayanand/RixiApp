const express = require('express');
const router = express.Router();
const User = require("../models/User");


// Certificate Verification Route
router.post("/verify-certificate", async (req, res) => {
 const {intern_id, certificate_id } = req.body;
  try {
    // Find user by intern_id and certificate_id
    const user = await User.findOne({intern_id:intern_id,certificate_id: certificate_id });
    if (user) {
      
     req.flash('success_msg', 'Certificate Verified Successfully!');
      res.render("verifyRedirect",{user});
    } else {
      // If not found, render certificate page with error message
      
      req.flash('error', 'Invalid Intern ID or Certificate ID');  
      res.redirect("/certificate");
    }
  } catch (err) {
    // console.error(err);
    req.flash('error_msg', 'Server Error');
  }
});

// Bootcamp Certificate Verification Route (for QR Code)
router.get("/verify-bootcamp-certificate/:certificate_id", async (req, res) => {
  try {
    const certificate_id = req.params.certificate_id;
    const BootcampUser = require("../models/BootcampUser");
    const Bootcamp = require("../models/Bootcamp");

    // Find the bootcamp user who has this certificate_id
    const user = await BootcampUser.findOne({
      "enrolledBootcamps.certificate_id": certificate_id
    });

    if (user) {
      // Find the specific enrollment
      const enrollment = user.enrolledBootcamps.find(e => e.certificate_id === certificate_id);
      const bootcamp = await Bootcamp.findById(enrollment.bootcamp_id);

      if (bootcamp) {
        // Construct a mock 'user' object for the verifyBootcampRedirect view
        const verifyData = {
          name: user.name,
          domain: bootcamp.name,
          starting_date: bootcamp.start_date,
          completion_date: enrollment.certificate_date || bootcamp.end_date || new Date(),
        };

        req.flash('success_msg', 'Certificate Verified Successfully!');
        res.render("verifyBootcampRedirect", { user: verifyData });
        return;
      }
    }
    
    // If not found
    req.flash('error', 'Invalid Certificate ID');
    res.redirect("/certificate");
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Server Error');
    res.redirect("/certificate");
  }
});

module.exports = router;