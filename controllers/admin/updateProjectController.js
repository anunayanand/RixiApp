const Project = require("../../models/Project");
const asyncHandler = require("../../utils/asyncHandler");

// Update Project
exports.updateProject = asyncHandler(async (req, res) => {
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
});
