const bcrypt = require("bcrypt");
const Ambassador = require("../../models/Ambassador");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const asyncHandler = require('../../utils/asyncHandler');

// Cloudinary storage for ambassador profile pics
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ambassador_profiles",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});
exports.upload = multer({ storage });

// 🛠 Create Ambassador (SuperAdmin only)
exports.createAmbassador = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    ambassador_id,
    password,
    referralId,
    college,
    university,
    designation,
    address,
    gender,
    linkedin_profile_url,
    insta_profile_url,
    discountPercent,
    equity
  } = req.body;

  // 🔹 Check if email, referralId or ambassador_id already exists
  const existing = await Ambassador.findOne({
    $or: [{ email }, { referralId }, { ambassador_id }]
  });
  if (existing) {
    if (existing.email === email) return res.json({ success: false, message: "Email already exists!" });
    else if (existing.referralId === referralId) return res.json({ success: false, message: "Referral ID already exists!" });
    else return res.json({ success: false, message: "Ambassador ID already exists!" });
  }

  // 🔒 Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // ✅ Prepare ambassador data
  let ambassadorData = {
    name,
    email,
    phone,
    ambassador_id,
    referralId,
    password: hashedPassword,
    college,
    university,
    designation,
    address,
    gender,
    linkedin_profile_url,
    insta_profile_url,
    isFirstLogin: true,
    discountPercent: discountPercent ? Math.min(100, Math.max(0, parseInt(discountPercent))) : 0,
    equity: equity ? Math.min(100, Math.max(0, parseFloat(equity))) : 0,
  };

  // ✅ Add uploaded image if exists
  if (req.file) {
    ambassadorData.img_url = req.file.path;
    ambassadorData.img_public_id = req.file.filename;
  }

  // 📦 Create ambassador
  const ambassador = new Ambassador(ambassadorData);
  await ambassador.save();

  res.json({ success: true, message: "Ambassador created successfully!" });
});
