const Ambassador = require("../../models/Ambassador");
const asyncHandler = require('../../utils/asyncHandler');

exports.deleteAmbassador = asyncHandler(async (req, res) => {
  const ambassador = await Ambassador.findById(req.params.id);

  if (!ambassador) {
    return res.json({ success: false, message: 'Ambassador not found' });
  }

  await Ambassador.findByIdAndDelete(req.params.id);

  return res.json({ success: true, message: `Ambassador "${ambassador.name}" Deleted Successfully!` });
});
