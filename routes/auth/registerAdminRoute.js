const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../../models/User");

// Register first admin
router.get("/register-admin", (req, res) => res.render("register"));

router.post("/register-admin", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = new User({ name, email, password: hashedPassword, role: "admin" });
  await admin.save();
  req.session.user = admin._id;
  req.session.role = "admin";
  res.redirect("/admin");
});

module.exports = router;
