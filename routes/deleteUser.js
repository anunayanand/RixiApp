const express = require('express');
const router = express.Router();
const User = require("../models/User");
const authRole = require('../middleware/authRole');

router.post("/delete-user/:id", authRole("superAdmin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Deleted Successfully` });
  } catch (err) {
    // console.error(err);
    res.json({ success: false, message: 'Failed to Delete User' });
  }
});

module.exports = router;