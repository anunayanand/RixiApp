const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Project = require("../models/Project");
const authRole = require('../middleware/authRole');

// =============================
// 👩‍🎓 CREATE INTERN (Admin Only)
// =============================
router.post("/create-user", authRole("admin"), async (req, res) => {
  try {
    const { 
      name, email, password, role, domain, college, university, 
      phone, course, year_sem, branch, duration, intern_id, batch_no, referal_code, starting_date, internshipType
    } = req.body;

    // ✅ Validation
    if (!name || !email || !password || !domain || !college || !university ||
        !phone || !course || !year_sem || !duration || !intern_id || !batch_no || !starting_date) {
      return res.status(400).json({ success: false, message: "All required fields must be filled!" });
    }

    // ✅ Check for existing email or intern_id
    const existingUser = await User.findOne({ $or: [{ email }, { intern_id }] });
    if (existingUser) {
      let msg = existingUser.email === email ? "Email already exists!" : "Intern ID already exists!";
      return res.status(400).json({ success: false, message: msg });
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Prepare user data
    let userData = {
      name, email, password: hashedPassword, role, domain, college, university,
      phone, course, year_sem, branch, duration: Number(duration),
      intern_id, batch_no, referal_code, starting_date, internshipType: internshipType || "Internship"
    };

    // ✅ Create the user
    const user = new User(userData);
    await user.save();

    // ✅ Assign eligible projects
    const projects = await Project.find({ domain, batch_no });
    const eligibleProjects = projects.filter(p => {
      if (p.week <= 4 && [4,6,8].includes(Number(duration))) return true;
      if (p.week === 6 && [6,8].includes(Number(duration))) return true;
      if (p.week === 8 && [8].includes(Number(duration))) return true;
      return false;
    });

    if (eligibleProjects.length > 0) {
      user.projectAssigned = eligibleProjects.map(p => ({
        projectId: p._id,
        week: p.week,
        status: "pending"
      }));
      await user.save();
    }

    res.json({ success: true, message: `Intern ${name} created successfully!` });

  } catch (err) {
    console.error("Error creating intern:", err);
    res.status(500).json({ success: false, message: "Error creating Intern." });
  }
});

module.exports = router;
