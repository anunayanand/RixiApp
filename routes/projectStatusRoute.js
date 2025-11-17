const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/projects/update-status', async (req, res) => {
  try {
    const { userId, projectId, status } = req.body;
    const isAjax = req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1) || req.headers['content-type'] === 'application/json';

    // 🔹 Validation
    if (!userId || !projectId || !status) {
      req.flash('error', 'Missing required fields');
      const flashMessages = req.flash();

      if (isAjax) {
        return res.status(400).json({
          success: false,
          type: 'error',
          message: flashMessages.error?.[0] || 'Missing required fields'
        });
      }

      return res.redirect('/admin');
    }

    // 🔹 Update project status
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, 'projectAssigned.projectId': projectId },
      { $set: { 'projectAssigned.$.status': status } },
      { new: true }
    );

    if (!updatedUser) {
      req.flash('error', 'User or project not found');
      const flashMessages = req.flash();

      if (isAjax) {
        return res.status(404).json({
          success: false,
          type: 'error',
          message: flashMessages.error?.[0] || 'User or project not found'
        });
      }

      return res.redirect('/admin');
    }

    // 🔹 Success or failure message
    if (status === 'accepted') {
      req.flash('success', `${updatedUser.name} project accepted successfully!`);
    } else {
      req.flash('error', `${updatedUser.name} project ${status}`);
    }

    const flashMessages = req.flash();

    if (isAjax) {
      return res.json({
        success: true,
        type: status === 'accepted' ? 'success' : 'error',
        message:
          flashMessages.success?.[0] ||
          flashMessages.error?.[0] ||
          `${updatedUser.name} project ${status}`
      });
    }

    return res.redirect('/admin');
  } catch (err) {
    console.error('🔥 Error updating project status:', err);

    req.flash('error', 'Error updating project status');
    const flashMessages = req.flash();

    const isAjax = req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1) || req.headers['content-type'] === 'application/json';

    if (isAjax) {
      return res.status(500).json({
        success: false,
        type: 'error',
        message: flashMessages.error?.[0] || 'Error updating project status'
      });
    }

    res.redirect('/admin');
  }
});

module.exports = router;
