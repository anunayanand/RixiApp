const bcrypt = require("bcrypt");
const User = require("../../models/User");
const Ambassador = require("../../models/Ambassador");
const Admin = require("../../models/Admin");
const SuperAdmin = require("../../models/SuperAdmin");
const BootcampManager = require("../../models/BootcampManager");

exports.loginUser = async (req, res) => {
  try {
    const { email, password, captchaInput } = req.body;

    // 🔒 Verify CAPTCHA
    if (!captchaInput || captchaInput.toLowerCase() !== (req.session.captcha || "").toLowerCase()) {
      req.flash("error", "Invalid CAPTCHA. Please try again.");
      return res.redirect("/login");
    }

    // CAPTCHA valid only once
    req.session.captcha = null;

    // Fetch both user and ambassador (parallel)
    const [user, ambassador] = await Promise.all([
      User.findOne({ email }),
      Ambassador.findOne({ email }),
    ]);

    let userMatch = false;
    let ambassadorMatch = false;

    // 👤 Check User credentials
    if (user) {
      userMatch = await bcrypt.compare(password, user.password);

      if (userMatch) {
        req.session.user = user._id;
        req.session.role = user.role;

        if (user.role === "admin" || user.role === "superAdmin") {
          return res.redirect("/admin-login");
        } else if (user.role === "intern") {
          req.flash("success", `Welcome, ${user.name.trim()}!`);
          return res.redirect("/intern");
        } else {
          // Unknown role - redirect to login with error
          req.flash("error", "Invalid user role. Please contact administrator.");
          return res.redirect("/login");
        }
      }
    }

    // 🤝 Check Ambassador credentials
    if (ambassador) {
      ambassadorMatch = await bcrypt.compare(password, ambassador.password);

      if (ambassadorMatch) {
        req.session.user = ambassador._id;
        req.session.role = "ambassador";
        req.session.isFirstLogin = ambassador.isFirstLogin;

        req.flash("success", `Welcome, Ambassador ${ambassador.name.trim()}!`);
        return res.redirect("/ambassador");
      }
    }

    // 🚫 No match
    req.flash("error", "Invalid email address or password");
    return res.redirect("/login");

  } catch (err) {
    console.error("🔥 Login Error:", err);
    req.flash("error", "Something went wrong, please try again.");
    return res.redirect("/login");
  }
};

exports.loginOrg = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Check if admin or superAdmin exists (parallel)
    const [admin, superAdmin, bootcampManager] = await Promise.all([
      Admin.findOne({ email }),
      SuperAdmin.findOne({ email }),
      BootcampManager.findOne({ email }),
    ]);

    let userMatch = null;

    // 👨‍💼 Check Admin credentials
    if (admin) {
      const match = await bcrypt.compare(password, admin.password);
      if (match) {
        userMatch = { user: admin, role: "admin" };
      }
    }

    // 👨‍💼 Check SuperAdmin credentials
    if (superAdmin && !userMatch) {
      const match = await bcrypt.compare(password, superAdmin.password);
      if (match) {
        userMatch = { user: superAdmin, role: "superAdmin" };
      }
    }

    // 👨‍🏫 Check BootcampManager credentials
    if (bootcampManager && !userMatch) {
      const match = await bcrypt.compare(password, bootcampManager.password);
      if (match) {
        userMatch = { user: bootcampManager, role: "bootcamp_manager" };
      }
    }

    if (!userMatch) {
      req.flash("error", "Invalid email address or password");
      return res.redirect("/admin-login");
    }

    // ✅ Save session
    req.session.user = userMatch.user._id;
    req.session.role = userMatch.role;

    // ✅ Role-based redirects
    if (userMatch.role === "admin") {
      req.flash("success", `Welcome, ${userMatch.user.name.trim()}!`);
      return res.redirect("/admin");
    } else if (userMatch.role === "superAdmin") {
      req.flash("success", `Welcome, ${userMatch.user.name.trim()}!`);
      return res.redirect("/superAdmin");
    } else if (userMatch.role === "bootcamp_manager") {
      req.flash("success", `Welcome, ${userMatch.user.name.trim()}!`);
      return res.redirect("/bootcampManager");
    }

  } catch (err) {
    console.error("🔥 Organizer Login Error:", err);
    req.flash("error", "Something went wrong, please try again.");
    return res.redirect("/admin-login");
  }
};

exports.logoutUser = async (req, res) => {
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
  } catch(err){
    // console.error(err);
    req.flash("error", "Error logging out");
    res.redirect("/login");
  }
};
