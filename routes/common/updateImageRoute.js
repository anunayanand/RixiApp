const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const Admin = require("../../models/Admin");
const SuperAdmin = require("../../models/SuperAdmin");
const Ambassador = require("../../models/Ambassador");
const authRole = require("../../middleware/authRole");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Storage for Admin profile pics
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "admins", // Cloudinary folder
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});
const upload = multer({ storage });
d = multer({ storage });

/* -----------------------------------
   🔸 USER PROFILE IMAGE UPDATE (Intern, Admin, SuperAdmin)
----------------------------------- */
router.post("/update-image", authRole(['intern','superAdmin','admin']), upload.single("image"), async (req, res) => {
  try {
    let userRecord = await User.findById(req.session.user);
    let role = "intern";
    
    if (!userRecord) {
      userRecord = await Admin.findById(req.session.user);
      if (userRecord) role = "admin";
    }
    
    if (!userRecord) {
      userRecord = await SuperAdmin.findById(req.session.user);
      if (userRecord) role = "superAdmin";
    }

    if (!userRecord) {
      req.flash("error", "User not found");
      return res.redirect("/login");
    }
    
    let redirectUrl = `/${role}`;

    if (!req.file) {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.json({ success: false, message: "Please upload an image" });
      }
      req.flash("error", "Please upload an image");
       return res.redirect(redirectUrl);
    }

    // Delete old image from Cloudinary (if exists)
    if (userRecord.img_public_id) {
      try {
        await cloudinary.uploader.destroy(userRecord.img_public_id);
      } catch (err) {
        console.error("⚠️ Error deleting old user image:", err);
      }
    }

    // Save new image info
    userRecord.img_url = req.file.path;
    userRecord.img_public_id = req.file.filename;
    await userRecord.save();

    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.json({ success: true, message: "Profile picture updated successfully!", img_url: userRecord.img_url });
    }

    req.flash("success", "Profile picture updated successfully!");
     return res.redirect(redirectUrl);

  } catch (err) {
    console.error("❌ Error updating intern image:", err);
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      return res.status(500).json({ success: false, message: "Server error while updating image." });
    }
    req.flash("error", "Server error while updating image.");
     return res.redirect(redirectUrl);
  }
});

/* -----------------------------------
   🔸 AMBASSADOR PROFILE IMAGE UPDATE
----------------------------------- */
router.post("/ambassador/update-image", authRole("ambassador"), upload.single("image"), async (req, res) => {
  try {
    const ambassador = await Ambassador.findById(req.session.user);
    if (!ambassador) {
      req.flash("error", "Ambassador not found");
      return res.redirect("/login");
    }

    if (!req.file) {
      req.flash("error", "Please upload an image");
      return res.redirect("/ambassador");
    }

    // Delete old image if it exists
    if (ambassador.img_public_id) {
      try {
        await cloudinary.uploader.destroy(ambassador.img_public_id);
      } catch (err) {
        console.error("⚠️ Error deleting old ambassador image:", err);
      }
    }

    // Save new image info
    ambassador.img_url = req.file.path;
    ambassador.img_public_id = req.file.filename;
    await ambassador.save();

    req.flash("success", "Profile picture updated successfully!");
    res.redirect("/ambassador");

  } catch (err) {
    console.error("❌ Error updating ambassador image:", err);
    req.flash("error", "Server error while updating image.");
    res.redirect("/ambassador");
  }
});

module.exports = router;
