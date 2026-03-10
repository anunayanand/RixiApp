const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require("../models/User");
const Admin = require("../models/Admin");
const Project = require("../models/Project");
const authRole = require('../middleware/authRole');

router.get("/intern", authRole("intern"), async (req, res) => {
  try {
    const intern = await User.findById(req.session.user)
      .populate('quizAssignments.quizId');

    if (!intern) {
      req.flash("error", "Intern not found");
      return res.redirect("/login");
    }
    intern.isOnline = true;
    await intern.save();
    // Fetch projects for intern’s domain + batch
    const projects = await Project.find({ 
      domain: intern.domain, 
      batch_no: intern.batch_no 
    });

    // Intern's project progress
    const assignedProjects = intern.projectAssigned || [];
    const assignedMeetings = intern.meetings || [];
    const acceptedCount = assignedProjects.filter(p => p.status === 'accepted').length;
    const duration = intern.duration;
    const arr = [0, 1, 2, 3, 4, 6, 8];
    const progress = Math.round((arr[acceptedCount] / duration) * 100);

    // Attendance
    const totalMeetings = assignedMeetings.length;
    const attended = assignedMeetings.filter(m => m.attendance === "present").length;  
    const attendanceRate = totalMeetings > 0 ? Math.round((attended / totalMeetings) * 100) : 0;

    const totalProjects = assignedProjects.length;
    const mentor = await Admin.findOne({ domain: intern.domain }).select("name");
    const mentorName = mentor?.name ?? "No Mentor";

    // Sort notifications (newest first)
    const notifications = (intern.notifications || []).sort((a, b) => b.createdAt - a.createdAt);

    // Assigned quizzes with populated quiz (only for intern's current batch and matching duration)
    const assignedQuizzes = (intern.quizAssignments || [])
      .filter(a => a && a.assigned && a.quizId && a.batch === intern.batch_no && a.quizId.week <= intern.duration)
      .map(a => ({
        quiz: a.quizId,
        score: a.score,
        attemptCount: a.attemptCount,
        isClosed: a.quizId?.isClosed || false
      }));

    req.flash('success_msg', 'Welcome to Intern Dashboard');
    
    // Format starting date
    const startingDate = intern.starting_date 
      ? new Date(intern.starting_date).toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric' 
        }) 
      : 'Not assigned';
    
    res.render("intern", {
      intern,
      projects,
      progress,
      attendanceRate,
      mentorName,
      totalProjects,
      assignedMeetings,
      showPasswordPopup: intern.isFirstLogin,
      assignedQuizzes,
      notifications,
      startingDate
    });

  } catch (err) {
    console.error("🔥 Intern Route Error:", err);
    req.flash("error", "Something went wrong loading the intern dashboard");
    return res.redirect("/login");
  }
});

router.post('/intern/change-password', authRole('intern'), async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;

    // Validate: fields must be present
    if (!newPassword || !confirmPassword) {
      req.flash('error', 'Please fill in all fields.');
      return res.redirect('/intern');
    }

    // Validate: passwords must match
    if (newPassword !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/intern');
    }

    // Validate: minimum 6 characters
    if (newPassword.length < 6) {
      req.flash('error', 'Password must be at least 6 characters long.');
      return res.redirect('/intern');
    }

    const intern = await User.findById(req.session.user);
    if (!intern) {
      req.flash('error', 'Intern not found.');
      return res.redirect('/login');
    }

    // Hash the new password and save
    intern.password = await bcrypt.hash(newPassword, 10);
    intern.isFirstLogin = false;
    await intern.save();

    req.flash('success_msg', 'Password changed successfully!');
    return res.redirect('/intern');

  } catch (error) {
    console.error('Change Password Error:', error);
    req.flash('error', 'Something went wrong. Please try again.');
    return res.redirect('/intern');
  }
});

module.exports = router;
