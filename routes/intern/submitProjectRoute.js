const express = require('express');
const router = express.Router();
const multer = require('multer');
const authRole = require('../../middleware/authRole');
const submitProjectController = require('../../controllers/intern/submitProjectController');

// Multer error handling wrapper
router.post('/intern/submit-project', authRole('intern'), (req, res, next) => {
  submitProjectController.upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'File is too large. Maximum size is 10 MB.' });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, submitProjectController.submitProject);

module.exports = router;
