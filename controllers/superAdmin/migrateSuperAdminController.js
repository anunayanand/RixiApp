const User = require("../../models/User");
const SuperAdmin = require("../../models/SuperAdmin");
const asyncHandler = require('../../utils/asyncHandler');

// Migration route - run this once to migrate superadmin from User to SuperAdmin collection
exports.migrateSuperAdmin = asyncHandler(async (req, res) => {
  // Check if superadmin already exists in SuperAdmin collection
  const existingSuperAdmin = await SuperAdmin.findOne({});
  if (existingSuperAdmin) {
    return res.json({ success: true, message: "SuperAdmin already migrated" });
  }

  // Find superadmin in User collection
  const userSuperAdmin = await User.findOne({ role: "superAdmin" });
  if (!userSuperAdmin) {
    return res.json({ success: false, message: "No superadmin found in User collection" });
  }

  // Create new SuperAdmin document
  const superAdmin = new SuperAdmin({
    name: userSuperAdmin.name,
    email: userSuperAdmin.email,
    phone: userSuperAdmin.phone || "",
    password: userSuperAdmin.password,
    img_url: userSuperAdmin.img_url,
    img_public_id: userSuperAdmin.img_public_id,
    isFirstLogin: userSuperAdmin.isFirstLogin,
    lastLogin: userSuperAdmin.lastLogin,
    meetings: userSuperAdmin.meetings || [],
    notifications: userSuperAdmin.notifications || [],
    notifiedInterns: userSuperAdmin.notifiedInterns || [],
    notice: userSuperAdmin.notice || [],
    twoFASecret: userSuperAdmin.twoFASecret,
    resetToken: userSuperAdmin.resetToken,
    otp: userSuperAdmin.otp,
    otpExpiry: userSuperAdmin.otpExpiry
  });

  await superAdmin.save();

  res.json({ 
    success: true, 
    message: "SuperAdmin migrated successfully. You can now access the site normally." 
  });
});
