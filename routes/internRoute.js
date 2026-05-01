const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require("../models/User");
const Admin = require("../models/Admin");
const Project = require("../models/Project");
const authRole = require('../middleware/authRole');

router.get("/intern", authRole("intern"), async (req, res, next) => {
  try {
    const intern = await User.findById(req.session.user)
      .populate('quizAssignments.quizId')
      .populate('lectureAssigned.lectureId');

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
    const progress = intern.progress || 0;

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
    
    // Prepare lectures
    const allLectures = (intern.lectureAssigned || [])
      .filter(la => la.lectureId)
      .map(la => ({
        _id: la._id, // Assignment subdocument ID used for tracking progress
        title: la.lectureId.title,
        description: la.lectureId.description,
        duration: la.lectureId.duration,
        videoId: la.lectureId.videoId,
        watchedTime: la.watchedTime,
        completed: la.completed
      }));

    // Lecture progress is stored in intern.lectureProgress (updated by the sync endpoint)
    const lectureProgress = intern.lectureProgress || 0;

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
      startingDate,
      allLectures,
      lectureProgress
    });

  } catch (err) {
    console.error("🔥 Intern Route Error:", err);
    next(err);
  }
});


router.post('/intern/lecture/:id/progress', authRole('intern'), async (req, res) => {
  try {
    const { watchedTime, duration } = req.body;
    const reqLectureId = req.params.id;

    if (typeof watchedTime !== 'number') {
      return res.status(400).json({ success: false, message: "Invalid watchedTime" });
    }

    const intern = await User.findById(req.session.user)
      .populate('lectureAssigned.lectureId');
    if (!intern) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Find the lecture assignment subdocument
    let lecture = null;

    if (intern.lectureAssigned) {
      lecture = intern.lectureAssigned.id(reqLectureId);
      if (!lecture) {
        lecture = intern.lectureAssigned.find(a => a.lectureId && (
          a.lectureId._id.toString() === reqLectureId || a.lectureId.toString() === reqLectureId
        ));
      }
    }

    if (!lecture) {
      return res.status(404).json({ success: false, message: "Lecture not found" });
    }

    // If already completed, skip all recalculations and DB writes, just return cached state
    if (lecture.completed) {
      return res.json({
        success: true,
        watchedTime: lecture.watchedTime,
        completed: lecture.completed,
        overallProgress: intern.lectureProgress // return cached overall progress
      });
    }

    // Only update watchedTime if it is greater than the currently saved one
    if (watchedTime > lecture.watchedTime) {
      lecture.watchedTime = watchedTime;
    }

    // Check completion condition (99% threshold)
    if (duration > 0 && (lecture.watchedTime / duration) >= 0.99) {
      lecture.completed = true;
    }

    // ── Recalculate overall lecture progress ──
    // Progress = (sum of all watchedTime) / (sum of all lecture durations) * 100
    let totalDurationSecs = 0;
    let totalWatchedSecs = 0;

    for (const la of intern.lectureAssigned) {
      let watched = la.watchedTime || 0;

      // Try to get the real duration from the populated Lecture document
      let lecDurationSecs = 0;

      if (la.lectureId && typeof la.lectureId === 'object') {
        // Parse the duration string (formats: "MM:SS", "H:MM:SS", or plain number in minutes)
        const durStr = la.lectureId.duration || '';
        lecDurationSecs = parseDurationToSeconds(durStr);
      }

      // If we couldn't parse it and this is the current lecture, use the client-sent value
      if (lecDurationSecs <= 0 && la._id.toString() === (lecture._id || '').toString() && duration > 0) {
        lecDurationSecs = duration;
      }

      // Fallback: if we still have no duration but have watchedTime, use watchedTime as floor
      // (a lecture with no duration set shouldn't penalize progress)
      if (lecDurationSecs <= 0 && watched > 0) {
        lecDurationSecs = watched;
      }

      // If the lecture is completed, count it fully towards progress
      if (la.completed && lecDurationSecs > 0) {
        watched = Math.max(watched, lecDurationSecs);
      }
      
      // Ensure watched never exceeds duration if duration is valid, to cap at 100% exactly
      if (lecDurationSecs > 0 && watched > lecDurationSecs) {
        watched = lecDurationSecs;
      }

      totalWatchedSecs += watched;
      totalDurationSecs += lecDurationSecs;
    }

    const overallProgress = totalDurationSecs > 0
      ? Math.min(100, Math.round((totalWatchedSecs / totalDurationSecs) * 100))
      : 0;

    await User.updateOne(
      { _id: intern._id, "lectureAssigned._id": lecture._id },
      { 
        $set: {
          "lectureAssigned.$.watchedTime": lecture.watchedTime,
          "lectureAssigned.$.completed": lecture.completed,
          lectureProgress: overallProgress
        }
      }
    );

    res.json({
      success: true,
      watchedTime: lecture.watchedTime,
      completed: lecture.completed,
      overallProgress
    });

  } catch (error) {
    console.error('Lecture Progress Sync Error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Parse a duration string to seconds.
 * Supports: "MM:SS", "H:MM:SS", "10 min", "1h 30m", or plain number (treated as minutes).
 */
function parseDurationToSeconds(str) {
  if (!str) return 0;
  str = str.trim();

  // "H:MM:SS" or "MM:SS"
  if (/^\d+:\d{2}(:\d{2})?$/.test(str)) {
    const parts = str.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
  }

  // "10 min", "5 mins", "1 hr", "1h 30m"
  let secs = 0;
  const hrMatch = str.match(/(\d+)\s*(h|hr|hrs|hour|hours)/i);
  const minMatch = str.match(/(\d+)\s*(m|min|mins|minute|minutes)/i);
  const secMatch = str.match(/(\d+)\s*(s|sec|secs|second|seconds)/i);
  if (hrMatch) secs += parseInt(hrMatch[1]) * 3600;
  if (minMatch) secs += parseInt(minMatch[1]) * 60;
  if (secMatch) secs += parseInt(secMatch[1]);
  if (secs > 0) return secs;

  // Plain number → treat as minutes
  const num = parseFloat(str);
  if (!isNaN(num) && num > 0) return num * 60;

  return 0;
}

module.exports = router;
