const User = require("../../models/User");
const asyncHandler = require('../../utils/asyncHandler');

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.json({ success: false, message: 'User not found' });
  }

  await User.findByIdAndDelete(req.params.id);

  return res.json({ success: true, message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Deleted Successfully` });
});
