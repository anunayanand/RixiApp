const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
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
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).send("User not found");

      // ✅ SuperAdmin updating an Admin
      if (user.role === "admin" && req.session.role === "superAdmin") {
        const {
          name,
          email,
          domain,
          emp_id,
          phone,
          designation,
          password,
        } = req.body;

        const existingUser = await User.findById(req.params.id);

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
          // If user already has a picture, delete it from Cloudinary
          if (user.img_public_id) {
            await cloudinary.uploader.destroy(user.img_public_id);
          }

          updateData.img_url = req.file.path;       // Cloudinary URL
          updateData.img_public_id = req.file.filename; // Cloudinary public_id
        }

        // Only hash if superAdmin entered a new password
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
        req.flash("success", "Admin Updated Successfully!");
        return res.redirect("/superAdmin");
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
        req.flash("success", "Intern Updated Successfully!");
        return res.redirect("/admin#viewInterns");
      }

      // Role mismatch
      req.flash("error", "No Authority to make this change");
      return res.redirect("/login");

    } catch (err) {
      console.error("Update Error:", err);
      req.flash("error", err.message);
      return res.redirect("back");
    }
  }
);

module.exports = router;
