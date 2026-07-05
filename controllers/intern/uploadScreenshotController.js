const User = require("../../models/User");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const asyncHandler = require('../../utils/asyncHandler');

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "screenshots",          // Folder for intern screenshots
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

exports.upload = multer({ storage });

exports.uploadScreenshot = asyncHandler(async (req, res) => {
  const { intern_id } = req.body;

  if (!req.file || !intern_id) {
    return ;
  }

  // Find the intern first
  const intern = await User.findById(intern_id);
  if (!intern) {
    return ;
  }

  // Delete previous screenshot from Cloudinary if exists
  if (intern.screenshot_public_id) {
    try {
      await cloudinary.uploader.destroy(intern.screenshot_public_id);
    } catch (err) {
      // console.warn("Failed to delete previous screenshot:", err.message);
    }
  }

  // Save new screenshot
  intern.screenshot_img = req.file.path;        // secure_url from Cloudinary
  intern.screenshot_public_id = req.file.filename; // public_id from Cloudinary
  await intern.save();

  return res.json({ success: true, url: req.file.path });
});
