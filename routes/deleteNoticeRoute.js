const express = require('express');
const router = express.Router();
const SuperAdmin = require("../models/SuperAdmin");
const authRole = require('../middleware/authRole');


// Delete a notice (SuperAdmin only)
router.post('/notice/delete/:index', authRole('superAdmin'), async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const superAdmin = await SuperAdmin.findById(req.session.user);

    if (superAdmin.notice && superAdmin.notice.length > index) {
      superAdmin.notice.splice(index, 1);
      await superAdmin.save();
      return res.json({ success: true, message: 'Notice deleted successfully.' });
    }

    return res.json({ success: false, message: 'Notice not found.' });
  } catch (err) {
    // console.error(err);
    res.json({ success: false, message: 'Failed to delete notice.' });
  }
});

module.exports = router;

