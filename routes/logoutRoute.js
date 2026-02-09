const express = require('express');
const router = express.Router();
const User = require("../models/User");
const Admin = require("../models/Admin");
const Ambassador = require("../models/Ambassador");
const SuperAdmin = require("../models/SuperAdmin");

router.get("/logout", async (req, res) => {
try{
    if (!req.session) {
    return res.redirect("/login"); // or handle gracefully
  }
  const userRole = req.session.role;
  const userId = req.session.user;

  // Set isOnline to false based on role
  try {
    switch (userRole) {
      case "intern":
        await User.findByIdAndUpdate(userId, { isOnline: false });
        break;
      case "admin":
        await Admin.findByIdAndUpdate(userId, { isOnline: false });
        break;
      case "ambassador":
        await Ambassador.findByIdAndUpdate(userId, { isOnline: false });
        break;
      case "superAdmin":
        await SuperAdmin.findByIdAndUpdate(userId, { isOnline: false });
        break;
    }
  } catch (updateErr) {
    // console.error("Error updating isOnline status:", updateErr);
  }

  req.session.destroy((err) => {
    if (err) {
      // console.error("Logout error:", err);
      return res.status(500).send("Failed to log out");
    }
    res.clearCookie("connect.sid");
     if (userRole === "admin" || userRole === "superAdmin") {
        return res.redirect("/admin-login");
      } else {
        return res.redirect("/login");
      }
  });
}catch(err){
    // console.error(err);
    req.flash("error", "Error logging out");
    res.redirect("/login");
  }
});


module.exports = router;

