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

    if (!project) {
        if (req.headers['content-type'] === 'application/json') {
            return res.json({ success: false, message: "Project not found" });
        }
        return res.flash("err", "Project not found");
    }

    if (req.headers['content-type'] === 'application/json') {
        return res.json({ success: true, isHidden: project.isHidden });
    }

    req.flash(
      "success",
      `Project "${project.title}" is now ${project.isHidden ? "hidden 🔒" : "visible 🔓"}`
    );
    res.redirect("/admin");
  } catch (err) {
    console.error(err);
    if (req.headers['content-type'] === 'application/json') {
        return res.json({ success: false, message: "Error in Closing Upload Button" });
    }
    res.flash("err", `Error in Closing Upload Button`);
  }
});

module.exports = router;
