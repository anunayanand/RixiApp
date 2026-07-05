const bcrypt = require("bcrypt");
const BootcampManager = require("../../models/BootcampManager");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const asyncHandler = require('../../utils/asyncHandler');

// Cloudinary storage for manager profile pics
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "bootcamp_managers",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

exports.upload = multer({ storage });

// =============================
// 👨‍🏫 CREATE BOOTCAMP MANAGER (SuperAdmin Only)
// =============================
exports.createBootcampManager = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "Name, email, and password must be filled!" });
  }

  // Check if manager already exists
  const existingManager = await BootcampManager.findOne({ email });
  if (existingManager) {
    return res.json({ success: false, message: "Email already exists!" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Prepare manager data
  let managerData = {
    name,
    email,
    password: hashedPassword
  };

  // Add uploaded image if exists
  if (req.file) {
    managerData.profile_image = req.file.path;
  }

  const manager = new BootcampManager(managerData);
  await manager.save();

  res.json({ success: true, message: "Bootcamp Manager created successfully!" });
});
