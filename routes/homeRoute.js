const express = require('express');
const router = express.Router();
const SuperAdmin = require("../models/SuperAdmin");
const Bootcamp = require("../models/Bootcamp");

router.get("/", async (req, res) => {
  try {
    const superAdminExists = await SuperAdmin.findOne({});
    if (!superAdminExists) return res.redirect("/register-superAdmin");

    // Fetch all live bootcamps sorted by creation date (newest first)
    const bootcamps = await Bootcamp.find({ status: 'live' })
      .sort({ creationDate: -1 })
      .lean();

    res.render("index", { bootcamps });
  } catch(err) {
    // console.error(err);
    req.flash("error", "Server Error");
    res.redirect("/login");
  }
});

module.exports = router;