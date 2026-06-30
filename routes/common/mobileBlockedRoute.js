const express = require('express');
const router = express.Router();
// in your routes file
router.get("/mobile-blocked", (req, res) => {
  req.flash("error", "Quiz can only be taken on a desktop / laptop.");
  return res.redirect("/logout");
});
module.exports = router;