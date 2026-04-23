const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authRole = require('../middleware/authRole');

// Update meeting attendance (single or bulk)
router.post('/meetings/update-attendance', authRole('admin'), async (req, res) => {
  try {
    const { attendance, interns } = req.body;

    if (!attendance) {
      return res.status(400).json({ success: false, message: 'Attendance value is required' });
    }

    if (!interns) {
      return res.status(400).json({ success: false, message: 'No interns selected' });
    }

    const internsArr = JSON.parse(interns);

    for(const item of internsArr){
      await User.findOneAndUpdate(
        { _id: item.userId, 'meetings._id': item.meetingId },
        { $set: { 'meetings.$.attendance': attendance } }
      );
    }

    res.json({ success: true, message: `Attendance marked as "${attendance}" for selected interns` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating attendance' });
  }
});

module.exports = router;
