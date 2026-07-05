const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const lectureController = require('../../controllers/admin/lectureController');

// =====================
// Admin CRUD (JSON API)
// =====================

// Create Lecture
router.post('/admin/lectures/create', authRole('admin'), lectureController.createLecture);

// Assign Lecture to Batch
router.post('/admin/lectures/assign', authRole('admin'), lectureController.assignLecture);

// Delete Lecture
router.post('/admin/lectures/delete/:id', authRole('admin'), lectureController.deleteLecture);

// Toggle Lecture Visibility
router.post('/admin/lectures/toggle/:id', authRole('admin'), lectureController.toggleLectureVisibility);

// =====================
// Intern Routes
// =====================

// Get signed token for lecture playback
router.get('/intern/lecture/:id/token', authRole('intern'), lectureController.getLectureToken);

// Lecture embed player route
router.get('/intern/lecture/play', authRole('intern'), lectureController.playLecture);

module.exports = router;
