const express = require('express');
const router = express.Router();
const SuperAdmin = require('../models/SuperAdmin');
const authRole = require('../middleware/authRole');

// Add a notice (SuperAdmin only)
router.post('/notice', authRole('superAdmin'), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.json({ success: false, message: 'Title and description are required.' });
    }

    const superAdmin = await SuperAdmin.findById(req.session.user);
    superAdmin.notice.push({ title, description });
    await superAdmin.save();

    res.json({ success: true, message: 'Notice added successfully.' });
  } catch (err) {
    // console.error(err);
    res.json({ success: false, message: 'Failed to add notice.' });
  }
});

module.exports = router;