const SuperAdmin = require("../../models/SuperAdmin");
const asyncHandler = require('../../utils/asyncHandler');

// Delete a notice (SuperAdmin only)
exports.deleteNotice = asyncHandler(async (req, res) => {
  const index = parseInt(req.params.index);
  const superAdmin = await SuperAdmin.findById(req.session.user);

  if (superAdmin.notice && superAdmin.notice.length > index) {
    superAdmin.notice.splice(index, 1);
    await superAdmin.save();
    return res.json({ success: true, message: 'Notice deleted successfully.' });
  }

  return res.json({ success: false, message: 'Notice not found.' });
});
