const express = require('express');
const router = express.Router();
const Admin = require("../models/Admin");
const authRole = require('../middleware/authRole');

router.post("/delete-admin/:id", authRole("superAdmin"), async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.json({ success: false, message: 'Admin not found' });
    }

    await Admin.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: 'Admin Deleted Successfully' });
  } catch (err) {
    res.json({ success: false, message: 'Failed to Delete Admin' });
  }
});

module.exports = router;
