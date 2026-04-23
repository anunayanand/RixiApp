const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const authRole = require("../middleware/authRole");
const User = require("../models/User");

// Update Project
router.post("/admin/project/update/:id", authRole("admin"), async (req, res) => {
  try {
    const { title, description, week, batch_no ,downloadLink, uploadLink} = req.body;

    await Project.findByIdAndUpdate(req.params.id, {
      title,
      description,
      week: Number(week),
      batch_no : Number(batch_no),
      downloadLink,
      uploadLink
    });

    res.json({ success: true, message: "Project updated successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error while updating project" });
  }
});

module.exports = router;