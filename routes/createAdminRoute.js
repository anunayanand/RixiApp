const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");
const authRole = require('../middleware/authRole');
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Cloudinary storage for admin profile pics
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "admin_profiles",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const upload = multer({ storage });

// =============================
// 👨‍💼 CREATE ADMIN (SuperAdmin Only)
// =============================
router.post("/create-admin", authRole("superAdmin"), upload.single("image"), async (req, res) => {
  try {
    const { name, email, password, domain, phone, emp_id, designation } = req.body;

    if (!name || !email || !password || !domain || !phone || !emp_id || !designation) {
      req.flash("error", "All required fields must be filled!");
      return res.redirect("/superAdmin");
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ $or: [{ email }, { emp_id }] });
    if (existingAdmin) {
      if (existingAdmin.email === email) req.flash("error", "Email already exists!");
      else req.flash("error", "Employee ID already exists!");
      return res.redirect("/superAdmin");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Prepare admin data
    let adminData = {
      name,
      email,
      password: hashedPassword,
      domain,
      phone,
      emp_id,
      designation
    };

    // Add uploaded image if exists
    if (req.file) {
      adminData.img_url = req.file.path;
      adminData.img_public_id = req.file.filename;
    }

    const admin = new Admin(adminData);
    await admin.save();

    req.flash("success", "Admin created successfully!");
    res.redirect("/superAdmin");

  } catch (err) {
    console.error(err);
    req.flash("error", "Error creating admin");
    res.redirect("/superAdmin");
  }
});

module.exports = router;
