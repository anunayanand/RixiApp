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
})
module.exports = router;