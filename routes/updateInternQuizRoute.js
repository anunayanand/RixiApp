const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authRole = require("../middleware/authRole");

router.post("/superAdmin/updateIntern/:id", authRole('superAdmin'), async (req, res) => {
  try {
    const {
      isPassed,
      quiz_score,
      attemptCount,
      assignmentScore,
      certificate_id,
      certificate_link,
      starting_date,
      completion_date
    } = req.body;

    // console.log("Incoming Update:", req.body);

    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash("error", "Intern not found");
      return res.json({ success: false, message: "Intern not found" });
     
    
    }


    // -------- Optional Updates (Only update if provided) -------- //

    if (isPassed !== undefined && isPassed !== null && isPassed !== "") {
      user.isPassed = isPassed === "true";
    }

    if (quiz_score !== undefined && quiz_score !== "") {
      user.quiz_score = Number(quiz_score);
    }

    if (certificate_id !== undefined && certificate_id !== "") {
      user.certificate_id = certificate_id;
    }

    if (certificate_link !== undefined ) {
      user.certificate_link = certificate_link;
    }

    if (starting_date !== undefined && starting_date !== "") {
      user.starting_date = new Date(starting_date);
    }

    if (completion_date !== undefined && completion_date !== "") {
      user.completion_date = new Date(completion_date);
    }

    // ---- Optional Quiz Assignment Update ---- //

    if (attemptCount !== undefined && assignmentScore !== undefined) {

      if (user.quizAssignments.length > 0) {
        if (attemptCount !== "") {
          user.quizAssignments[0].attemptCount = Number(attemptCount);
        }
        if (assignmentScore !== "") {
          user.quizAssignments[0].score = Number(assignmentScore);
        }
      } else {
        user.quizAssignments.push({
          assigned: true,
          batch: user.batch_no || "default",
          attemptCount: Number(attemptCount || 0),
          score: Number(assignmentScore || 0)
        });
      }
    }

    await user.save();

    return res.json({ success: true });

  } catch (error) {
    console.error("Update Intern Error:", error);
    return res.json({ success: false, message: "Server error", error: error.message });
  }
});


module.exports = router;
