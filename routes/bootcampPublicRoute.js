const express = require('express');
const router = express.Router();
const axios = require('axios');
const { google } = require('googleapis');
const Bootcamp = require('../models/Bootcamp');
const BootcampUser = require('../models/BootcampUser');

// ==============================
// CONFIGURATION
// ==============================
const CASHFREE_BASE_URL = "https://api.cashfree.com/pg";
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

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

async function sendWelcomeEmail(user, bootcamp) {
    const loginLink = `${process.env.BASE_URL || 'http://localhost:3000'}/bootcamp-portal/login`;
    const subject = `Welcome to ${bootcamp.name} - Rixi Lab`;
    const body = `
      <html>
      <body style="font-family: Arial, sans-serif; background-color: #f4f6f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #6366f1;">Welcome to ${bootcamp.name}!</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Your registration is confirmed. We are thrilled to have you in this bootcamp.</p>
            <p>You can access your exclusive dashboard to track your sessions, progress, and download your certificate using the link below:</p>
            <a href="${loginLink}" style="display: inline-block; padding: 12px 25px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">Access Dashboard</a>
            <p style="margin-top: 20px; color: #555; font-size: 14px;">Please use your registered email (<strong>${user.email}</strong>) to log in via OTP.</p>
            
            <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">
              © ${new Date().getFullYear()} Rixi Lab | <a href="https://rixilab.tech" style="color:#6366f1;">www.rixilab.tech</a>
            </p>
        </div>
      </body>
      </html>
    `;
    const encodedMail = makeBody(user.email, process.env.EMAIL, subject, body);
    try {
        await gmail.users.messages.send({ userId: 'me', resource: { raw: encodedMail } });
    } catch (err) {
        console.error("Failed to send welcome email:", err.message);
    }
}

// ==============================
// ROUTES
// ==============================

// Public Bootcamp Listings
router.get('/', async (req, res) => {
    try {
        const bootcamps = await Bootcamp.find({ status: 'live' });
        res.render('bootcamps/list', { bootcamps, messages: req.flash() });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Unable to load bootcamps');
        res.redirect('/');
    }
});

// Bootcamp Details & Registration Page
router.get('/:id', async (req, res) => {
    try {
        const bootcamp = await Bootcamp.findById(req.params.id);
        if (!bootcamp || bootcamp.status !== 'live') {
            req.flash('error', 'Bootcamp not found or expired');
            return res.redirect('/bootcamps');
        }
        res.render('bootcamps/details', { bootcamp, messages: req.flash() });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Unable to load bootcamp details');
        res.redirect('/bootcamps');
    }
});

// Registration & Payment Initiation
router.post('/register/:id', async (req, res) => {
    try {
        const bootcamp = await Bootcamp.findById(req.params.id);
        if (!bootcamp || bootcamp.status !== 'live') {
            req.flash('error', 'Bootcamp not available.');
            return res.redirect('/bootcamps');
        }

        const { name, email, phone } = req.body;
        let user = await BootcampUser.findOne({ email });
        
        // Check if already enrolled
        if (user && user.enrolledBootcamps.some(b => b.bootcamp_id.toString() === bootcamp._id.toString())) {
            req.flash('error', 'You are already registered for this bootcamp.');
            return res.redirect(`/bootcamps/${bootcamp._id}`);
        }

        if (bootcamp.isPaid) {
            // Setup Cashfree Payment
            const orderId = `bc_${Date.now()}_${Math.floor(Math.random()*1000)}`;
            const requestPayload = {
                order_id: orderId,
                order_amount: bootcamp.payment.amount,
                order_currency: "INR",
                customer_details: {
                    customer_id: user ? user._id.toString() : `new_${Date.now()}`,
                    customer_name: name,
                    customer_email: email,
                    customer_phone: phone
                },
                order_meta: {
                    return_url: `${process.env.BASE_URL || 'http://localhost:3000'}/bootcamps/payment-callback?order_id=${orderId}`
                }
            };

            const response = await axios.post(`${CASHFREE_BASE_URL}/orders`, requestPayload, {
                headers: {
                    "Content-Type": "application/json",
                    "x-api-version": "2023-08-01",
                    "x-client-id": CASHFREE_APP_ID,
                    "x-client-secret": CASHFREE_SECRET_KEY
                }
            });

            // Store pending registration in session
            req.session.pendingBootcampRegistration = {
                bootcampId: bootcamp._id,
                name, email, phone,
                orderId
            };

            const paymentSessionId = response.data.payment_session_id;
            return res.render('bootcamps/checkout', { paymentSessionId });
        } else {
            // Free Bootcamp Registration
            if (!user) {
                user = new BootcampUser({ name, email, phone, enrolledBootcamps: [] });
            }
            user.enrolledBootcamps.push({
                bootcamp_id: bootcamp._id,
                progress: 0,
                attendance: []
            });
            await user.save();
            
            bootcamp.usersEnrolled.push(user._id);
            await bootcamp.save();

            await sendWelcomeEmail(user, bootcamp);

            req.flash('success', 'Registration successful! Check your email for login details.');
            res.redirect('/bootcamps');
        }
    } catch (err) {
        console.error(err);
        req.flash('error', 'Registration failed. Please try again.');
        res.redirect(`/bootcamps/${req.params.id}`);
    }
});

// Payment Callback from Cashfree
router.get('/payment-callback', async (req, res) => {
    try {
        const { order_id } = req.query;
        if (!order_id || !req.session.pendingBootcampRegistration) {
            req.flash('error', 'Invalid payment session.');
            return res.redirect('/bootcamps');
        }

        const pending = req.session.pendingBootcampRegistration;
        if (pending.orderId !== order_id) {
            req.flash('error', 'Order ID mismatch.');
            return res.redirect('/bootcamps');
        }

        // Verify with Cashfree
        const response = await axios.get(`${CASHFREE_BASE_URL}/orders/${order_id}/payments`, {
            headers: {
                "x-api-version": "2023-08-01",
                "x-client-id": CASHFREE_APP_ID,
                "x-client-secret": CASHFREE_SECRET_KEY
            }
        });

        const payment = response.data[0];
        
        if (payment && payment.payment_status === "SUCCESS") {
            const bootcamp = await Bootcamp.findById(pending.bootcampId);
            let user = await BootcampUser.findOne({ email: pending.email });
            
            if (!user) {
                user = new BootcampUser({ 
                    name: pending.name, 
                    email: pending.email, 
                    phone: pending.phone, 
                    enrolledBootcamps: [] 
                });
            }

            user.enrolledBootcamps.push({
                bootcamp_id: bootcamp._id,
                progress: 0,
                attendance: []
            });
            await user.save();
            
            bootcamp.usersEnrolled.push(user._id);
            if (bootcamp.payment && bootcamp.payment.amount > 0) {
                // optional: track total revenue or payment IDs inside bootcamp schema if needed
            }
            await bootcamp.save();

            req.session.pendingBootcampRegistration = null;

            await sendWelcomeEmail(user, bootcamp);

            req.flash('success', 'Payment successful! Registration complete. Check your email for access.');
            res.redirect('/bootcamps');
        } else {
            req.flash('error', 'Payment failed or was cancelled.');
            res.redirect(`/bootcamps/${pending.bootcampId}`);
        }
    } catch (err) {
        console.error(err);
        req.flash('error', 'Error verifying payment.');
        res.redirect('/bootcamps');
    }
});

module.exports = router;
