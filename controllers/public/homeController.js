const SuperAdmin = require("../../models/SuperAdmin");
const Bootcamp = require("../../models/Bootcamp");
const asyncHandler = require("../../utils/asyncHandler");

exports.getHomePage = asyncHandler(async (req, res) => {
  const superAdminExists = await SuperAdmin.findOne({});
  if (!superAdminExists) return res.redirect("/register-superAdmin");

  // Fetch all live bootcamps sorted by creation date (newest first)
  const bootcamps = await Bootcamp.find({ status: 'live' })
    .sort({ creationDate: -1 })
    .lean();

  res.render("index", { bootcamps });
});
