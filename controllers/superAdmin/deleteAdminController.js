const Admin = require("../../models/Admin");
const asyncHandler = require('../../utils/asyncHandler');

exports.deleteAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);

  if (!admin) {
    return res.json({ success: false, message: 'Admin not found' });
  }

  await Admin.findByIdAndDelete(req.params.id);

  return res.json({ success: true, message: 'Admin Deleted Successfully' });
});
