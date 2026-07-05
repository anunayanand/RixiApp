const express = require("express");
const router = express.Router();
const authRole = require("../../middleware/authRole");
const updateUserController = require("../../controllers/admin/updateUserController");

// Update user route
router.post(
  "/update-user/:id",
  authRole(["admin", "superAdmin"]),
  updateUserController.uploadUserImage.single("img_url"),  // 👈 Multer will intercept image
  updateUserController.updateUser
);

module.exports = router;
