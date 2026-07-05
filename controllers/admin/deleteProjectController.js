const Project = require('../../models/Project');
const User = require('../../models/User');
const asyncHandler = require('../../utils/asyncHandler');

exports.deleteProject = asyncHandler(async (req, res) => {
  const projectId = req.params.id;

  // Delete the project
  const deletedProject = await Project.findByIdAndDelete(projectId);
  if (!deletedProject) {
    return res.status(404).json({ success: false, message: "Project not found" });
  }

  // Remove project from all users' projectAssigned array
  await User.updateMany(
    { "projectAssigned.projectId": projectId },
    { $pull: { projectAssigned: { projectId: projectId } } }
  );

  res.json({ success: true, message: `${deletedProject.title} deleted successfully` });
});
