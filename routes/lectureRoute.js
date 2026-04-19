const express = require('express');
const router = express.Router();
const Lecture = require('../models/Lecture');
const User = require('../models/User');
const Admin = require('../models/Admin');
const authRole = require('../middleware/authRole');
const crypto = require('crypto');
const axios = require('axios');

const LECTURE_SECRET = process.env.LECTURE_SECRET;

// Helper: Extract YouTube Video ID from URL
function extractVideoId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Helper: Fetch YouTube Video Duration
async function fetchYoutubeDuration(videoId) {
  try {
    const { data } = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const match = data.match(/"lengthSeconds":"(\d+)"/);
    if (match && match[1]) {
      const totalSeconds = parseInt(match[1], 10);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      const paddedMinutes = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes);
      const paddedSeconds = String(seconds).padStart(2, '0');

      if (hours > 0) {
        return `${hours}:${paddedMinutes}:${paddedSeconds}`;
      } else {
        return `${paddedMinutes}:${paddedSeconds}`;
      }
    }
  } catch (err) {
    console.error('Error fetching YouTube duration:', err.message);
  }
  return '';
}

// =====================
// Admin CRUD (JSON API)
// =====================

// Create Lecture
router.post('/admin/lectures/create', authRole('admin'), async (req, res) => {
  try {
    const { title, description, youtubeUrl, week, duration } = req.body;
    const admin = await Admin.findById(req.session.user);
    if (!admin) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ success: false, message: 'Invalid YouTube URL. Please provide a valid link.' });
    }

    let finalDuration = duration;
    if (!finalDuration || finalDuration.trim() === '') {
      finalDuration = await fetchYoutubeDuration(videoId);
    }

    const newLecture = new Lecture({
      title,
      description,
      videoId,
      domain: admin.domain,
      week,
      createdBy: admin._id,
      duration: finalDuration
    });
    await newLecture.save();

    res.json({
      success: true,
      message: 'Lecture created successfully!',
      lecture: newLecture
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Assign Lecture to Batch
router.post('/admin/lectures/assign', authRole('admin'), async (req, res) => {
  try {
    const { lectureId, batch_no } = req.body;
    const admin = await Admin.findById(req.session.user);
    if (!admin) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const lecture = await Lecture.findOne({ _id: lectureId, domain: admin.domain });
    if (!lecture) return res.status(404).json({ success: false, message: 'Lecture not found' });

    // Track assignment on the lecture
    if (!lecture.assignedBatches.includes(batch_no)) {
      lecture.assignedBatches.push(batch_no);
      await lecture.save();
    }

    // Determine eligible intern durations for this lecture's week
    const allDurations = [4, 6, 8];
    const eligibleDurations = allDurations.filter(d => d >= lecture.week);

    // Assign to eligible interns in the batch
    const interns = await User.find({ 
      domain: admin.domain, 
      batch_no,
      duration: { $in: eligibleDurations }
    });
    let assignedCount = 0;

    for (let intern of interns) {
      if (!intern.lectureAssigned.some(la => la.lectureId.toString() === lectureId)) {
        intern.lectureAssigned.push({ lectureId: lecture._id });
        await intern.save();
        assignedCount++;
      }
    }

    res.json({
      success: true,
      message: `Lecture assigned to ${assignedCount} intern(s) in Batch ${batch_no}`,
      assignedBatches: lecture.assignedBatches
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete Lecture
router.post('/admin/lectures/delete/:id', authRole('admin'), async (req, res) => {
  try {
    const admin = await Admin.findById(req.session.user);
    if (!admin) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const deleted = await Lecture.findOneAndDelete({ _id: req.params.id, domain: admin.domain });
    if (!deleted) return res.status(404).json({ success: false, message: 'Lecture not found' });

    await User.updateMany(
      { domain: admin.domain },
      { $pull: { lectureAssigned: { lectureId: req.params.id } } }
    );

    res.json({ success: true, message: 'Lecture deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Toggle Lecture Visibility
router.post('/admin/lectures/toggle/:id', authRole('admin'), async (req, res) => {
  try {
    const admin = await Admin.findById(req.session.user);
    if (!admin) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const lecture = await Lecture.findOne({ _id: req.params.id, domain: admin.domain });
    if (!lecture) return res.status(404).json({ success: false, message: 'Lecture not found' });

    lecture.isHidden = !lecture.isHidden;
    await lecture.save();

    res.json({ success: true, isHidden: lecture.isHidden });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =====================
// Intern Routes
// =====================

// Get signed token for lecture playback
router.get('/intern/lecture/:id/token', authRole('intern'), async (req, res) => {
  try {
    const intern = await User.findById(req.session.user);
    if (!intern) return res.status(401).json({ error: 'Unauthorized' });

    const lid = req.params.id;
    let videoId = null;

    // Check lectureAssigned[] → Lecture collection
    const assigned = intern.lectureAssigned.find(
      a => a._id.toString() === lid || a.lectureId.toString() === lid
    );
    const refId = assigned ? assigned.lectureId : lid;
    const actualLecture = await Lecture.findById(refId);
    if (actualLecture) videoId = actualLecture.videoId;

    if (!videoId) return res.status(404).json({ error: 'Lecture not found' });

    const payload = JSON.stringify({
      lid,
      uid: intern._id.toString(),
      exp: Date.now() + 90000 // 90 seconds
    });

    const b64 = Buffer.from(payload).toString('base64url');
    const sig = crypto.createHmac('sha256', LECTURE_SECRET).update(b64).digest('base64url');
    return res.json({ token: `${b64}.${sig}`, videoId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Lecture embed player route
router.get('/intern/lecture/play', authRole('intern'), async (req, res) => {
  try {
    const [b64, sig] = (req.query.token || '').split('.');
    if (!b64 || !sig) return res.status(403).send('Invalid token');

    const expected = crypto.createHmac('sha256', LECTURE_SECRET).update(b64).digest('base64url');
    if (sig !== expected) return res.status(403).send('Invalid token');

    const { lid, uid, exp } = JSON.parse(Buffer.from(b64, 'base64url').toString());
    if (Date.now() > exp) return res.status(403).send('Token expired');
    if (uid !== req.session.user.toString()) return res.status(403).send('Unauthorized');

    const intern = await User.findById(req.session.user);
    if (!intern) return res.status(401).send('Unauthorized');

    let videoId = null;

    // Check lectureAssigned or Lecture collection
    let refId = lid;
    const assigned = intern.lectureAssigned.find(a => a.lectureId.toString() === lid || a._id.toString() === lid);
    if (assigned) {
      refId = assigned.lectureId;
    }
    
    const actualLecture = await Lecture.findById(refId);
    if (actualLecture) {
      videoId = actualLecture.videoId;
    }

    if (!videoId) return res.status(404).send('Not found');

    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&controls=0&disablekb=1`;
    return res.redirect(embedUrl);
  } catch (error) {
    console.error(error);
    return res.status(500).send('Server Error');
  }
});

module.exports = router;
