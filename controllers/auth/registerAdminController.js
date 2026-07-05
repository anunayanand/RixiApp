const bcrypt = require("bcrypt");
const User = require("../../models/User");
const asyncHandler = require("../../utils/asyncHandler");

exports.getRegisterAdmin = asyncHandler(async (req, res) => {
  res.render("register");
});

exports.postRegisterAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = new User({ name, email, password: hashedPassword, role: "admin" });
  await admin.save();
  req.session.user = admin._id;
  req.session.role = "admin";
  res.redirect("/admin");
});
