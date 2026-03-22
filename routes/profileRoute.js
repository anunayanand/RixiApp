const express = require('express');
const router = express.Router();
require('dotenv').config();
const crypto = require('crypto');
const Admin = require('../models/Admin');
const SuperAdmin = require('../models/SuperAdmin');

// Helper to generate the correct signature for a given emp_id
// Uses SESSION_SECRET as the HMAC key (or a fallback if not defined)
const generateSignature = (empId) => {
  const secret = process.env.SESSION_SECRET || 'd91a7ad388c1415e247b327f4074b48e';
  return crypto.createHmac('sha256', secret).update(empId).digest('hex').substring(0, 16);
};

// GET /profile/:emp_id
router.get('/:emp_id', async (req, res) => {
  try {
    const originalEmpId = req.params.emp_id;

    // 1. Check for cryptographic signature.
    // Allow either the standard HMAC signature OR a special environment-defined DIRECTOR_QR_SIGN for RL240901.
    const expectedSig = generateSignature(originalEmpId);
    const providedSig = req.query.sig;
    
    const isValid = (providedSig === expectedSig) || 
                  (originalEmpId === 'RL240901' && providedSig === process.env.DIRECTOR_QR_SIGN);

    if (!providedSig || !isValid) {
      return res.status(403).render('pages/403');
    }

    // Alias: if the requested ID is RL240901, fetch data for RL250201 instead
    let empId = originalEmpId;
    if (empId === 'RL240901') {
      empId = 'RL250201';
    }
    let employee = null;
    let role = '';

    // 2. Dual-model lookup: check Admin first, then SuperAdmin
    const adminRecord = await Admin.findOne({ emp_id: empId });
    if (adminRecord) {
      employee = adminRecord;
      role = 'Admin';
    } else {
      const superAdminRecord = await SuperAdmin.findOne({ emp_id: empId });
      if (superAdminRecord) {
        employee = superAdminRecord;
        role = 'Super Admin';
      }
    }

    // 3. Render the profile view
    // If employee is null, the view will handle the "Not Found" state gracefully.
    res.render('employeeProfile', {
      employee: employee,
      role: role
    });

  } catch (error) {
    console.error('Error fetching employee profile:', error);
    res.status(500).render('pages/500');
  }
});

module.exports = { router, generateSignature };
