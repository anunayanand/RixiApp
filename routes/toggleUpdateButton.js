const express = require("express");
const router = express.Router();
const Project = require("../models/Project");

// Toggle visibility route
router.post("/project/toggle-visibility/:id", async (req, res) => {
  try {
    const { isHidden } = req.body;

    // Debug: log received body
    // console.log("Toggle body:", req.body);

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isHidden },       // <-- just set the value
      { new: true }       // return updated doc
    );

    if (!project) return res.flash("err","Project not found");

   req.flash(
  "success",
  `Project "${project.title}" is now ${project.isHidden ? "hidden 🔒" : "visible 🔓"}`
   );
res.redirect("/admin");
  } catch (err) {
    console.error(err);
    res.flash("err",`Error in Closing Upload Button`);
  }
});

module.exports = router;
