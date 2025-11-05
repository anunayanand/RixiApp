const express = require('express');
const router = express.Router();

router.get("/logout", (req, res) => {
try{
    if (!req.session) {
    return res.redirect("/login"); // or handle gracefully
  }
  const userRole = req.session.role;

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

