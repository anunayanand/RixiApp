const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Admin = require("../models/Admin");
const authRole = require("../middleware/authRole");
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


// Update user route
router.post(
  "/update-user/:id",
  authRole(["admin", "superAdmin"]),
  upload.single("img_url"),  // 👈 Multer will intercept image
  async (req, res) => {
    try {
      // Try User model first, then Admin model (admins are in a separate collection)
      let user = await User.findById(req.params.id);
      let isAdminModel = false;

      if (!user) {
        // Could be an Admin document
        user = await Admin.findById(req.params.id);
        isAdminModel = true;
      }

      if (!user) return res.status(404).send("User not found");

      // ✅ SuperAdmin updating an Admin (Admin model)
      if (isAdminModel && req.session.role === "superAdmin") {
        const {
          name,
          email,
          domain,
          emp_id,
          phone,
          designation,
          password,
        } = req.body;

        let updateData = {
          name,
          email,
          domain,
          emp_id,
          phone,
          designation,
        };

        // If file uploaded, Cloudinary returns URL in req.file.path
        if (req.file) {
          // If admin already has a picture, delete it from Cloudinary
          if (user.img_public_id) {
            await cloudinary.uploader.destroy(user.img_public_id);
          }
          updateData.img_url = req.file.path;
          updateData.img_public_id = req.file.filename;
        }

        // Only hash if superAdmin entered a new password
        if (password && password.trim() !== "") {
          const isSamePassword = await bcrypt.compare(password, user.password);
          if (!isSamePassword) {
            updateData.password = await bcrypt.hash(password, 10);
            updateData.isFirstLogin = true;
          }
        }

        await Admin.findByIdAndUpdate(req.params.id, updateData);
        return res.json({ success: true, message: "Admin Updated Successfully!" });
      }

      // ✅ SuperAdmin updating an Admin stored in User model (role === 'admin')
      if (!isAdminModel && user.role === "admin" && req.session.role === "superAdmin") {
        const {
          name,
          email,
          domain,
          emp_id,
          phone,
          designation,
          password,
        } = req.body;

        let updateData = {
          name,
          email,
          domain,
          emp_id,
          phone,
          designation,
        };

        if (req.file) {
          if (user.img_public_id) {
            await cloudinary.uploader.destroy(user.img_public_id);
          }
          updateData.img_url = req.file.path;
          updateData.img_public_id = req.file.filename;
        }

        if (password && password.trim() !== "") {
          const isSamePassword = await bcrypt.compare(password, user.password);
          if (!isSamePassword) {
            updateData.password = await bcrypt.hash(password, 10);
            updateData.isFirstLogin = true;
          }
        }

        await User.findByIdAndUpdate(req.params.id, updateData);
        return res.json({ success: true, message: "Admin Updated Successfully!" });
      }

      // ✅ Admin updating an Intern
      if (user.role === "intern" && req.session.role === "admin") {
        const {
          name,
          email,
          domain,
          college,
          university,
          year_sem,
          phone,
          branch,
          batch_no,
          certificate_id,
          offer_letter,
          certificate_link,
          duration,
          starting_date,
          password,
        } = req.body;

        const existingUser = await User.findById(req.params.id);

        let updateData = {
          name,
          email,
          domain,
          college,
          university,
          year_sem,
          phone,
          branch,
          batch_no,
          certificate_id,
          offer_letter,
          certificate_link,
          duration,
          starting_date,
        };

        // only handle password if a new one is typed
        if (password && password.trim() !== "") {
          const isSamePassword = await bcrypt.compare(
            password,
            existingUser.password
          );
          if (!isSamePassword) {
            updateData.password = await bcrypt.hash(password, 10);
            updateData.isFirstLogin = true;
          }
        }

        await User.findByIdAndUpdate(req.params.id, updateData);
        return res.json({ success: true, message: "Intern Updated Successfully!" });
      }

      // Role mismatch
      return res.status(403).json({ success: false, message: "No Authority to make this change" });

    } catch (err) {
      console.error("Update Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
