const Project = require("../../models/Project");
const asyncHandler = require("../../utils/asyncHandler");

// Toggle visibility route
exports.toggleProjectVisibility = asyncHandler(async (req, res) => {
  const { isHidden } = req.body;

  const project = await Project.findByIdAndUpdate(
    req.params.id,
    { isHidden },       // <-- just set the value
    { new: true }       // return updated doc
  );

  if (!project) {
      if (req.headers['content-type'] === 'application/json') {
          return res.json({ success: false, message: "Project not found" });
      }
      // Assuming res.flash is intended, but normally it's req.flash
      // changing to req.flash for consistency if it was an error in original code
      req.flash("error", "Project not found");
      return res.redirect("/admin");
  }

  if (req.headers['content-type'] === 'application/json') {
      return res.json({ success: true, isHidden: project.isHidden });
  }

  req.flash(
    "success",
    `Project "${project.title}" is now ${project.isHidden ? "hidden 🔒" : "visible 🔓"}`
  );
  res.redirect("/admin");
});
