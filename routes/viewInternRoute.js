const express = require('express');
const router = express.Router();
const User = require("../models/User");
const authRole = require('../middleware/authRole');
const Project = require("../models/Project");

router.get("/admin/intern/:internId", authRole(['admin','superAdmin']), async (req, res) => {
  try{
    const intern = await User.findById(req.params.internId).populate('quizAssignments.quizId');
  if (!intern || intern.role !== "intern"){
    req.flash("error", "Intern not found");
    return res.redirect("/admin")
  } ;
      const assignedProjects = intern.projectAssigned || [];
      const acceptedCount = assignedProjects.filter(p => p.status === 'accepted').length;
      const totalProjects = intern.projectAssigned.length;
      const progress = totalProjects > 0 ? Math.round((acceptedCount / totalProjects) * 100) : 0;
      // console.log("Progress:", progress);
      const totalMeetings = intern.meetings.length;
      const attended = intern.meetings.filter(m => m.attendance === "present").length;  
      const attendanceRate = totalMeetings > 0 ? Math.round((attended / totalMeetings) * 100) : 0;
      const mentor = await User.findOne({ role: "admin", domain: intern.domain }).select("name"); 
      const mentorName = mentor?.name ?? "No Mentor";
      const assignedMeetings = intern.meetings || [];
      const assignedQuizzes = (intern.quizAssignments || [])
      .filter(a => a.assigned)
      .map(a => ({
        quiz: a.quizId,
        score: a.score,
        attemptCount: a.attemptCount,
        isClosed: a.quizId.isClosed
      }));
  // Sort notifications (newest first)
  const notifications = intern.notifications.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
  const projects = await Project.find({ domain: intern.domain });
  const showPasswordPopup = false;
  req.flash('info', `Viewing Intern: ${intern.name}`);
  res.render("intern", { intern, projects,progress,attendanceRate,mentorName,totalProjects,assignedMeetings,showPasswordPopup,assignedQuizzes,notifications});
  }catch(err){
    console.error(err);
    req.flash("error", "Intern details loading failed");
    res.redirect("/admin");
  }
});
module.exports = router;