const express = require("express");
const router = express.Router();
const uploadScreenshotController = require("../../controllers/intern/uploadScreenshotController");

// Route: Upload screenshot
// 'screenshot' is the field name in form-data (if using <input type="file">)
router.post("/upload-screenshot", uploadScreenshotController.upload.single("screenshot"), uploadScreenshotController.uploadScreenshot);

module.exports = router;
