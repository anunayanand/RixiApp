const User = require("../../models/User");
const BootcampUser = require("../../models/BootcampUser");
const Bootcamp = require("../../models/Bootcamp");
const asyncHandler = require("../../utils/asyncHandler");

// Certificate Verification Route
exports.verifyCertificate = asyncHandler(async (req, res) => {
  const {intern_id, certificate_id } = req.body;
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
});

// Bootcamp Certificate Verification Route (for QR Code)
exports.verifyBootcampCertificate = asyncHandler(async (req, res) => {
  const certificate_id = req.params.certificate_id;

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
        completion_date: bootcamp.end_date,  
      };

      req.flash('success_msg', 'Certificate Verified Successfully!');
      res.render("verifyBootcampRedirect", { user: verifyData });
      return;
    }
  }
  
  // If not found
  req.flash('error', 'Invalid Certificate ID');
  res.redirect("/certificate");
});
