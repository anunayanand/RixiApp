const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const Admin = require('../../models/Admin');
const asyncHandler = require('../../utils/asyncHandler');

router.get('/support-center', authRole('admin'), asyncHandler(async (req, res) => {
    const adminId = req.session.user;
    const admin = await Admin.findById(adminId);
    
    if (!admin || !admin.designation || admin.designation.trim().toLowerCase() !== "support team head") {
        req.flash('error', 'Access denied. Only Support Team Head can access this page.');
        return res.redirect('/admin');
    }

    admin.isOnline = true;
    await admin.save();

    res.render('supportCenter', { admin });
}));

module.exports = router;
