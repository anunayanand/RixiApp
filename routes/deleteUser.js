const express = require('express');
const router = express.Router();
const User = require("../models/User");
const authRole = require('../middleware/authRole');

router.post("/delete-user/:id", authRole("superAdmin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect("/superAdmin");
    }

    await User.findByIdAndDelete(req.params.id);

    req.flash('success', `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Deleted Successfully`);

    if (user.role === "admin") {
      return res.redirect("/superAdmin#viewAdmins");
    } else if (user.role === "intern") {
      return res.redirect("/superAdmin#viewInterns");
    } else {
      return res.redirect("/superAdmin"); // fallback
    }
  } catch (err) {
    // console.error(err);
    req.flash('error', 'Failed to Delete User');
    res.redirect("/superAdmin");
  }
});

module.exports = router;