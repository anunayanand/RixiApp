const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const SuperAdmin = require("../models/SuperAdmin");

router.post("/register-superAdmin", async (req, res) => {
  try{
    // Check if superadmin already exists
    const existingSuperAdmin = await SuperAdmin.findOne({});
    if (existingSuperAdmin) {
      req.flash("error", "Super Admin already exists");
      return res.redirect("/login");
    }
    
    const { name, email, password,phone } = req.body;
   const hashedPassword = await bcrypt.hash(password, 10);
   const superadmin = new SuperAdmin({ name, email, phone,password: hashedPassword });
   await superadmin.save();
    req.session.user = superadmin._id;
    req.session.role = "superAdmin";
    req.flash("success", "Super Admin registered successfully");
    res.redirect("/superAdmin");
   }catch(err){
      console.error(err);
      req.flash("error", "Super Admin registration failed");
      res.redirect("/register-superAdmin");
   }
 });

module.exports = router;
