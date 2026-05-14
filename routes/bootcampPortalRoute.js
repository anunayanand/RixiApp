const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const BootcampUser = require('../models/BootcampUser');
const Bootcamp = require('../models/Bootcamp');

// ==============================
// GMAIL API CONFIGURATION
// ==============================
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });
const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

function makeBody(to, from, subject, message) {
  const str = [
    "Content-Type: text/html; charset=\"UTF-8\"\n",
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    "to: ", to, "\n",
    "from: ", from, "\n",
    "subject: ", subject, "\n\n",
    message
  ].join('');
  return Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
}

// ==============================
// MIDDLEWARE
// ==============================
const requireBootcampUser = (req, res, next) => {
    if (req.session.bootcampUser) {
        next();
    } else {
        req.flash('error', 'Please log in to access your portal.');
        res.redirect('/bootcamp-portal/login');
    }
};

// ==============================
// ROUTES
// ==============================

// GET Login Page
router.get('/login', (req, res) => {
    if (req.session.bootcampUser) {
        return res.redirect('/bootcamp-portal');
    }
    res.render('bootcampUser/login', { messages: req.flash() });
});

// POST Send OTP
router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await BootcampUser.findOne({ email });
        if (!user) {
            req.flash('error', 'No bootcamp account found with that email.');
            return res.redirect('/bootcamp-portal/login');
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        req.session.bootcampOtp = {
            email: user.email,
            otp: otp,
            expires: Date.now() + 10 * 60 * 1000 // 10 minutes valid
        };

        const subject = `Your Rixi Lab Bootcamp Login OTP`;
        const body = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #4f46e5; margin: 0;">Rixi Lab Bootcamp</h2>
                </div>
                <p style="color: #333; font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
                <p style="color: #555; font-size: 15px; line-height: 1.5;">You requested to log in to your Bootcamp Portal. Please use the One-Time Password (OTP) below to securely log in:</p>
                
                <div style="text-align: center; margin: 35px 0;">
                    <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; background: #f8fafc; padding: 15px 35px; border-radius: 8px; border: 1px solid #e2e8f0; color: #1e293b;">${otp}</span>
                </div>
                
                <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                    This OTP is valid for 10 minutes. If you did not request this, please ignore this email.
                </p>
            </div>
        `;

        const encodedMail = makeBody(user.email, process.env.EMAIL, subject, body);
        await gmail.users.messages.send({ userId: 'me', resource: { raw: encodedMail } });

        res.render('bootcampUser/verify-otp', { email: user.email, messages: req.flash() });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to send OTP. Please try again.');
        res.redirect('/bootcamp-portal/login');
    }
});

// POST Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const sessionOtp = req.session.bootcampOtp;

        if (!sessionOtp || sessionOtp.email !== email) {
            req.flash('error', 'OTP session expired. Please request a new one.');
            return res.redirect('/bootcamp-portal/login');
        }

        if (Date.now() > sessionOtp.expires) {
            req.flash('error', 'OTP has expired. Request a new one.');
            return res.redirect('/bootcamp-portal/login');
        }

        if (sessionOtp.otp !== otp) {
            req.flash('error', 'Invalid OTP. Please try again.');
            return res.render('bootcampUser/verify-otp', { email, messages: req.flash() });
        }

        const user = await BootcampUser.findOne({ email });
        req.session.bootcampUser = user._id;
        req.session.bootcampOtp = null; // Clear OTP
        
        res.redirect('/bootcamp-portal');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Verification failed.');
        res.redirect('/bootcamp-portal/login');
    }
});

// GET Dashboard
router.get('/', requireBootcampUser, async (req, res) => {
    try {
        const user = await BootcampUser.findById(req.session.bootcampUser).populate('enrolledBootcamps.bootcamp_id');
        res.render('bootcampUser/dashboard', { user, messages: req.flash() });
    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.bootcampUser = null;
    res.redirect('/bootcamp-portal/login');
});

module.exports = router;
