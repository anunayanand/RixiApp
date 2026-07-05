const User = require("../../models/User");
const { sendResetPasswordMail } = require("../../services/emails/resetPasswordMail");
const asyncHandler = require("../../utils/asyncHandler");

exports.sendOtp = asyncHandler(async (req, res) => {
  const { intern_id, email } = req.body;

  if (!intern_id || !email) {
    req.flash("error", "All fields are required");
    return res.status(400).json({ success: false, msg: "All fields are required", flash: req.flash("error") });
  }

  const user = await User.findOne({ intern_id, email });

  if (!user) {
    req.flash("error", "User not found with provided details");
    return res.status(404).json({ success: false, msg: "User not found with provided details", flash: req.flash("error") });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  user.otp = otp;
  user.otpExpiry = Date.now() + 10 * 60 * 1000;
  await user.save();

  await sendResetPasswordMail(user, otp);

  req.flash("success", "OTP sent successfully!");
  return res.json({ success: true, msg: "OTP sent successfully", flash: req.flash("success") });
});
