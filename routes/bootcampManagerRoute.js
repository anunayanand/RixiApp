const express = require('express');
const router = express.Router();
const authRole = require('../middleware/authRole');
const BootcampManager = require('../models/BootcampManager');
const Bootcamp = require('../models/Bootcamp');
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "bootcamps",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});
const upload = multer({ storage });

// Ensure only bootcamp managers can access
router.use(authRole('bootcamp_manager'));

// Dashboard route
router.get('/', async (req, res) => {
    try {
        const manager = await BootcampManager.findById(req.session.user);
        if (!manager) {
            req.flash('error', 'Manager not found');
            return res.redirect('/login');
        }

        const bootcamps = await Bootcamp.find().populate('usersEnrolled');
        
        res.render('bootcampManager/dashboard', {
            manager: manager,
            bootcamps: bootcamps,
            messages: req.flash()
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Server error loading dashboard');
        res.redirect('/login');
    }
});

// Render create page
router.get('/create', async (req, res) => {
    try {
        const manager = await BootcampManager.findById(req.session.user);
        res.render('bootcampManager/create', { manager });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error loading create page');
        res.redirect('/bootcampManager');
    }
});

// Manage Bootcamps page
router.get('/manage', async (req, res) => {
    try {
        const manager = await BootcampManager.findById(req.session.user);
        const bootcamps = await Bootcamp.find().populate('usersEnrolled');
        res.render('bootcampManager/manage', {
            manager,
            bootcamps,
            messages: req.flash()
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error loading manage page');
        res.redirect('/bootcampManager');
    }
});

// Handle bootcamp creation
router.post('/create', upload.single('banner_img'), async (req, res) => {
    try {
        const { bootcamp_id, name, description, isPaid, amount, start_date, end_date, session_id, session_instructor, session_link, session_time, session_expiryTime, session_details } = req.body;
        
        if (!req.file) {
            req.flash('error', 'Please upload a banner image');
            return res.redirect('/bootcampManager/create');
        }

        const banner_img = req.file.path;
        const banner_public_id = req.file.filename;
        
        let formattedSessions = [];
        if (session_id) {
            if (Array.isArray(session_id)) {
                for (let i = 0; i < session_id.length; i++) {
                    formattedSessions.push({
                        session_id: session_id[i],
                        instructor: session_instructor[i],
                        link: session_link[i],
                        time: new Date(session_time[i]),
                        expiryTime: new Date(session_expiryTime[i]),
                        details: session_details[i] || ''
                    });
                }
            } else {
                formattedSessions.push({
                    session_id,
                    instructor: session_instructor,
                    link: session_link,
                    time: new Date(session_time),
                    expiryTime: new Date(session_expiryTime),
                    details: session_details || ''
                });
            }
        }

        const newBootcamp = new Bootcamp({
            bootcamp_id,
            name,
            description,
            banner_img,
            banner_public_id,
            isPaid: isPaid === 'true',
            payment: {
                amount: amount ? Number(amount) : 0,
                currency: 'INR'
            },
            start_date: start_date ? new Date(start_date) : undefined,
            end_date: end_date ? new Date(end_date) : undefined,
            sessions: formattedSessions,
            usersEnrolled: [],
            status: 'draft'  // saved as draft; manager publishes explicitly
        });

        await newBootcamp.save();
        req.flash('success', 'Bootcamp created successfully!');
        res.redirect('/bootcampManager/manage');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error creating bootcamp: ' + err.message);
        res.redirect('/bootcampManager/create');
    }
});

// Render Users View
router.get('/users', async (req, res) => {
    try {
        const manager = await BootcampManager.findById(req.session.user);
        const BootcampUser = require('../models/BootcampUser');
        const users = await BootcampUser.find().populate('enrolledBootcamps.bootcamp_id');
        res.render('bootcampManager/users', { manager, users });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error loading users page');
        res.redirect('/bootcampManager');
    }
});

// Render Attendance View
router.get('/attendance', async (req, res) => {
    try {
        const manager = await BootcampManager.findById(req.session.user);
        const bootcamps = await Bootcamp.find();
        
        const bootcampId = req.query.bootcamp_id;
        const sessionId = req.query.session_id;

        let selectedBootcamp = null;
        let enrolledUsers = [];
        if (bootcampId) {
            selectedBootcamp = await Bootcamp.findById(bootcampId);
            const BootcampUser = require('../models/BootcampUser');
            enrolledUsers = await BootcampUser.find({
                'enrolledBootcamps.bootcamp_id': bootcampId
            });
        }

        res.render('bootcampManager/attendance', { 
            manager, 
            bootcamps, 
            selectedBootcamp, 
            enrolledUsers,
            selectedSessionId: sessionId 
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error loading attendance page');
        res.redirect('/bootcampManager');
    }
});

// Update Attendance POST
router.post('/attendance/update', async (req, res) => {
    try {
        const { bootcamp_id, session_id, user_id, status } = req.body;
        const BootcampUser = require('../models/BootcampUser');
        
        const user = await BootcampUser.findById(user_id);
        if (user) {
            const enrollment = user.enrolledBootcamps.find(b => b.bootcamp_id.toString() === bootcamp_id);
            if (enrollment) {
                const sessionRecord = enrollment.attendance.find(a => a.session_id === session_id);
                if (sessionRecord) {
                    sessionRecord.status = status;
                } else {
                    enrollment.attendance.push({ session_id, status });
                }
                
                // Recalculate progress
                const bootcamp = await Bootcamp.findById(bootcamp_id);
                if (bootcamp && bootcamp.sessions.length > 0) {
                    const totalSessions = bootcamp.sessions.length;
                    const presentSessions = enrollment.attendance.filter(a => a.status === 'present').length;
                    enrollment.progress = Math.round((presentSessions / totalSessions) * 100);
                } else {
                    enrollment.progress = 0;
                }

                await user.save();
            }
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ── Publish / Unpublish Toggle ──
router.post('/bootcamp/:id/toggle-publish', async (req, res) => {
    try {
        const bootcamp = await Bootcamp.findById(req.params.id);
        if (!bootcamp) {
            req.flash('error', 'Bootcamp not found');
            return res.redirect('/bootcampManager');
        }
        bootcamp.status = bootcamp.status === 'live' ? 'draft' : 'live';
        await bootcamp.save();
        req.flash('success', `Bootcamp is now ${bootcamp.status === 'live' ? 'Published (Live)' : 'Unpublished (Draft)'}`);
        res.redirect('/bootcampManager/manage');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error toggling publish status');
        res.redirect('/bootcampManager');
    }
});

// ── Edit Bootcamp – Render Form ──
router.get('/edit/:id', async (req, res) => {
    try {
        const manager = await BootcampManager.findById(req.session.user);
        const bootcamp = await Bootcamp.findById(req.params.id);
        if (!bootcamp) {
            req.flash('error', 'Bootcamp not found');
            return res.redirect('/bootcampManager');
        }
        res.render('bootcampManager/edit', { manager, bootcamp, messages: req.flash() });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error loading edit page');
        res.redirect('/bootcampManager');
    }
});

// ── Edit Bootcamp – Handle Submission ──
router.post('/edit/:id', upload.single('banner_img'), async (req, res) => {
    try {
        const { name, description, isPaid, amount, start_date, end_date,
                session_id, session_instructor, session_link, session_time, session_expiryTime, session_details } = req.body;

        const bootcamp = await Bootcamp.findById(req.params.id);
        if (!bootcamp) {
            req.flash('error', 'Bootcamp not found');
            return res.redirect('/bootcampManager');
        }

        let banner_img = bootcamp.banner_img;
        let banner_public_id = bootcamp.banner_public_id;

        if (req.file) {
            if (bootcamp.banner_public_id) {
                try {
                    await cloudinary.uploader.destroy(bootcamp.banner_public_id);
                } catch (e) {
                    console.error('Error deleting old banner:', e);
                }
            }
            banner_img = req.file.path;
            banner_public_id = req.file.filename;
        }

        let formattedSessions = [];
        if (session_id) {
            if (Array.isArray(session_id)) {
                for (let i = 0; i < session_id.length; i++) {
                    formattedSessions.push({
                        session_id: session_id[i],
                        instructor: session_instructor[i],
                        link: session_link[i],
                        time: new Date(session_time[i]),
                        expiryTime: new Date(session_expiryTime[i]),
                        details: session_details[i] || ''
                    });
                }
            } else {
                formattedSessions.push({
                    session_id,
                    instructor: session_instructor,
                    link: session_link,
                    time: new Date(session_time),
                    expiryTime: new Date(session_expiryTime),
                    details: session_details || ''
                });
            }
        }

        await Bootcamp.findByIdAndUpdate(req.params.id, {
            name,
            description,
            banner_img,
            banner_public_id,
            isPaid: isPaid === 'true',
            payment: {
                amount: amount ? Number(amount) : 0,
                currency: 'INR'
            },
            start_date: start_date ? new Date(start_date) : undefined,
            end_date: end_date ? new Date(end_date) : undefined,
            sessions: formattedSessions
        });

        req.flash('success', 'Bootcamp updated successfully!');
        res.redirect('/bootcampManager/manage');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error updating bootcamp: ' + err.message);
        res.redirect(`/bootcampManager/edit/${req.params.id}`);
    }
});

module.exports = router;
