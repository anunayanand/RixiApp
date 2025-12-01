const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");

router.post("/verify-reset", async (req, res) => {
    const { intern_id, email, otp } = req.body;

    try {
        const user = await User.findOne({ intern_id, email });

        if (!user) {
            req.flash("error", "Invalid user details");
            return res.json({ 
                success: false, 
                msg: "Invalid details", 
                flash: req.flash("error") 
            });
        }

        if (!user.otp || !user.otpExpiry) {
            req.flash("error", "OTP not generated");
            return res.json({ 
                success: false, 
                msg: "OTP not generated", 
                flash: req.flash("error") 
            });
        }

        if (Date.now() > user.otpExpiry) {
            req.flash("error", "OTP expired");
            return res.json({ 
                success: false, 
                msg: "OTP expired", 
                flash: req.flash("error") 
            });
        }

        if (otp !== user.otp) {
            req.flash("error", "Invalid OTP");
            return res.json({ 
                success: false, 
                msg: "Invalid OTP", 
                flash: req.flash("error") 
            });
        }

        // Hash password as intern_id
        const hashedPassword = await bcrypt.hash(intern_id, 10);
        user.password = hashedPassword;
        user.isFirstLogin = true;
        // Clear OTP fields
        user.otp = null;
        user.otpExpiry = null;

        await user.save();

        req.flash("success", "Password reset successfully!");
        return res.json({ 
            success: true, 
            msg: "Password reset successfully", 
            flash: req.flash("success") ,
            redirect: "/login"
        });

    } catch (err) {
        // console.error("Error in verify-reset:", err);

        req.flash("error", "Server Error while resetting password");
        return res.json({ 
            success: false, 
            msg: "Error resetting password", 
            flash: req.flash("error"),
            error: err.message || err 
        });
    }
});

module.exports = router;
