const express = require('express');
const router = express.Router();
const SuperAdmin = require("../models/SuperAdmin");

router.get("/", async (req, res) => {
  
  try{
    const superAdminExists = await SuperAdmin.findOne({});
  if (!superAdminExists) return res.redirect("/register-superAdmin");
  res.render("index");
  }catch(err){
    // console.error(err);
    req.flash("error", "Server Error");
    res.redirect("/login");
  }
});

module.exports = router;