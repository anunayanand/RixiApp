const express = require('express');
const router = express.Router();
const User = require("../models/User");
const Project = require("../models/Project");
const authRole = require('../middleware/authRole');

router.get("/intern", authRole("intern"), async (req, res) => {
  try {
    // Populate quizAssignments.quizId to get full quiz details
    const intern = await User.findById(req.session.user)
      .populate('quizAssignments.quizId');

    if (!intern) {
      req.flash("error", "Intern not found");
      return res.redirect("/login");
    }

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
    const arr = [0,1,2,3,4,6,8];
    const progress = Math.round((arr[acceptedCount] / duration)*100);

    // Attendance
    const totalMeetings = assignedMeetings.length;
    const attended = assignedMeetings.filter(m => m.attendance === "present").length;  
    const attendanceRate = totalMeetings > 0 ? Math.round((attended / totalMeetings) * 100) : 0;

    const totalProjects = assignedProjects.length;
    const mentor = await User.findOne({ role: "admin", domain: intern.domain });

    // Assigned quizzes with populated quiz
    const assignedQuizzes = (intern.quizAssignments || [])
      .filter(a => a.assigned)
      .map(a => ({
        quiz: a.quizId,        // full quiz object now
        score: a.score,
        attemptCount: a.attemptCount,
        isClosed: a.quizId.isClosed
      }));

    req.flash('success_msg', 'Welcome to Intern Dashboard');
    res.render("intern", {
      intern,
      projects,
      progress,
      attendanceRate,
      mentor,
      totalProjects,
      assignedMeetings,
      showPasswordPopup: intern.isFirstLogin,
      assignedQuizzes
    });

  } catch (err) {
    console.error("Error in /intern:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
