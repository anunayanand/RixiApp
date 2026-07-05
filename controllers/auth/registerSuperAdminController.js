const bcrypt = require("bcrypt");
const SuperAdmin = require("../../models/SuperAdmin");
const asyncHandler = require("../../utils/asyncHandler");

exports.postRegisterSuperAdmin = asyncHandler(async (req, res) => {
  // Check if superadmin already exists
  const existingSuperAdmin = await SuperAdmin.findOne({});
  if (existingSuperAdmin) {
    req.flash("error", "Super Admin already exists");
    return res.redirect("/login");
  }
  
  const { name, email, password, phone } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const superadmin = new SuperAdmin({ name, email, phone, password: hashedPassword });
  
  await superadmin.save();
  
  req.session.user = superadmin._id;
  req.session.role = "superAdmin";
  req.flash("success", "Super Admin registered successfully");
  res.redirect("/superAdmin");
});
