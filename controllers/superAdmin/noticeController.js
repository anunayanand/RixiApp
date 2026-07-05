const SuperAdmin = require('../../models/SuperAdmin');
const asyncHandler = require('../../utils/asyncHandler');

// Add a notice (SuperAdmin only)
exports.addNotice = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    return res.json({ success: false, message: 'Title and description are required.' });
  }

  const superAdmin = await SuperAdmin.findById(req.session.user);
  superAdmin.notice.push({ title, description });
  await superAdmin.save();

  res.json({ success: true, message: 'Notice added successfully.' });
});
