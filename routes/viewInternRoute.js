const express = require('express');
const router = express.Router();
const User = require("../models/User");
const authRole = require('../middleware/authRole');
const Project = require("../models/Project");

router.get("/admin/intern/:internId", authRole(['admin','superAdmin']), async (req, res) => {
  try{
    const intern = await User.findById(req.params.internId);
  if (!intern || intern.role !== "intern"){
    req.flash("error", "Intern not found");
    return res.redirect("/admin")
  } ;
      const assignedProjects = intern.projectAssigned || [];
      const acceptedCount = assignedProjects.filter(p => p.status === 'accepted').length;
      let duration = intern.duration;
      let arr = [0,1,2,3,4,6,8];
      const progress = Math.round((arr[acceptedCount] / duration)*100);
      // console.log("Progress:", progress);
      const totalMeetings = intern.meetings.length;
      const totalProjects = intern.projectAssigned.length;
      const attended = intern.meetings.filter(m => m.attendance === "present").length;  
      const attendanceRate = totalMeetings > 0 ? Math.round((attended / totalMeetings) * 100) : 0;
      const mentor = await User.findOne({ role: "admin", domain: intern.domain });
      const assignedMeetings = intern.meetings || [];
      const assignedQuizzes = (intern.quizAssignments || [])
      .filter(a => a.assigned)
      .map(a => ({
        quiz: a.quizId,
        score: a.score,
        attemptCount: a.attemptCount,
        isClosed: a.quizId.isClosed
      }));

  const projects = await Project.find({ domain: intern.domain });
  req.flash('info', `Viewing Intern: ${intern.name}`);
  res.render("intern", { intern, projects,progress,attendanceRate,mentor,totalProjects,assignedMeetings,showPasswordPopup: intern.isFirstLogin ,assignedQuizzes});
  }catch(err){
    // console.error(err);
    req.flash("error", "Intern details loading failed");
    res.redirect("/admin");
  }
});
module.exports = router;