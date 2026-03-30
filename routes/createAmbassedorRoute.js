const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Ambassador = require("../models/Ambassador");
const authRole = require("../middleware/authRole");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Cloudinary storage for ambassador profile pics
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ambassador_profiles",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});
const upload = multer({ storage });

// 🛠 Create Ambassador (SuperAdmin only)
router.post("/create-ambassador", authRole("superAdmin"), upload.single("image"), async (req, res) => {
  try {
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
      discountPercent
    } = req.body;

    // 🔹 Check if email, referralId or ambassador_id already exists
    const existing = await Ambassador.findOne({
      $or: [{ email }, { referralId }, { ambassador_id }]
    });
    if (existing) {
      if (existing.email === email) req.flash("error", "Email already exists!");
      else if (existing.referralId === referralId) req.flash("error", "Referral ID already exists!");
      else req.flash("error", "Ambassador ID already exists!");
      return res.redirect("/superAdmin");
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
    };

    // ✅ Add uploaded image if exists
    if (req.file) {
      ambassadorData.img_url = req.file.path;
      ambassadorData.img_public_id = req.file.filename;
    }

    // 📦 Create ambassador
    const ambassador = new Ambassador(ambassadorData);
    await ambassador.save();

    req.flash("success", "Ambassador created successfully!");
    res.redirect("/superAdmin");

  } catch (err) {
    console.error("Error creating ambassador:", err);
    req.flash("error", "Something went wrong! Please try again.");
    res.redirect("/superAdmin");
  }
});

module.exports = router;
