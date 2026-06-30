const express = require('express');
const router = express.Router();
const axios = require('axios');
const { google } = require('googleapis');
const Bootcamp = require("../../models/Bootcamp");
const BootcampUser = require("../../models/BootcampUser");
const rawUrl = process.env.BASE_URL || 'https://rixilab.in';
const BASE_URL = rawUrl.replace('https://', 'www.');
// ==============================
// CONFIGURATION
// ==============================
const CASHFREE_BASE_URL = "https://api.cashfree.com/pg";
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

const oAuth2Client = new google.auth.OAuth2(
  process.env.PROJECT_INFO_CLIENT_ID,
  process.env.PROJECT_INFO_CLIENT_SECRET,
  process.env.PROJECT_INFO_REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.PROJECT_INFO_REFRESH_TOKEN });
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
    const loginLink = `${BASE_URL || 'https://www.rixilab.in'}/bootcamp-portal/login`;
    const subject = `Welcome to ${bootcamp.name} - Rixi Lab Technologies`;
    const body = `
  
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>

<style>

body{
  margin:0;
  padding:0;
  background:#f5f5f5;
  font-family:Arial,sans-serif;
}

table{
  border-spacing:0;
}

img{
  border:0;
  display:block;
}

@media screen and (max-width:600px){

  .container{
    width:100% !important;
  }

  .content{
    padding:24px 16px !important;
  }

  .heading{
    font-size:24px !important;
    line-height:1.3 !important;
  }

  .subtext{
    font-size:13px !important;
    line-height:1.7 !important;
  }

  .normal-text{
    font-size:13px !important;
    line-height:1.8 !important;
  }

  .account-title{
    font-size:15px !important;
  }

  .list-text{
    font-size:13px !important;
  }

  .button{
    display:block !important;
    width:100% !important;
    box-sizing:border-box !important;
    padding:14px 18px !important;
    font-size:14px !important;
    border-radius:10px !important;
  }

  .account-card{
    padding:20px !important;
  }

  .footer-text{
    font-size:11px !important;
  }

}

</style>
</head>

<body>

<table width="100%" bgcolor="#f5f5f5" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:24px 12px;">

<table 
  width="600"
  class="container"
  cellpadding="0"
  cellspacing="0"
  bgcolor="#ffffff"
  style="
    max-width:600px;
    border-radius:22px;
    overflow:hidden;
    border:1px solid #ececec;
  "
>

<tr>
  <td height="6" bgcolor="#ff6600"></td>
</tr>

<tr>
<td class="content" style="padding:40px 30px;">

<!-- Logo -->
<table width="100%">
<tr>
<td align="center">

<table 
  width="88"
  height="88"
  cellpadding="0"
  cellspacing="0"
  style="
    background:#fff3eb;
    border-radius:50%;
  "
>
<tr>
<td align="center" valign="middle">

<img 
  src="https://rixilab.in/img/Rixi%20Lab%20New%20Logo%20PNG.png"
  width="52"
  alt="Rixi Lab Technologies"
/>

</td>
</tr>
</table>

<h1 
  class="heading"
  style="
    margin:22px 0 0;
    font-size:32px;
    line-height:1.25;
    color:#ff6600;
    font-weight:bold;
  "
>
  ${bootcamp.name}
</h1>

<p 
  class="subtext"
  style="
    margin:12px 0 0;
    color:#777;
    font-size:14px;
    line-height:1.7;
  "
>
  Your registration has been confirmed successfully
</p>

</td>
</tr>
</table>

<!-- Greeting -->
<table width="100%" style="margin-top:38px;">
<tr>
<td>

<p 
  style="
    margin:0;
    font-size:14px;
    color:#222;
    font-weight:500;
  "
>
  Hi <strong>${user.name}</strong>,
</p>

<p 
  class="normal-text"
  style="
    margin:18px 0 0;
    font-size:12px;
    line-height:1.9;
    color:#555;
  "
>
  We're excited to have you onboard for this bootcamp journey.
  Your dashboard is now ready where you can access sessions,
  track progress, and download your certificate.
</p>

</td>
</tr>
</table>

<!-- Account Information -->
<table 
  width="100%"
  cellpadding="0"
  cellspacing="0"
  style="
    margin-top:28px;
    background:#fffaf7;
    border:1px solid #ffd8c2;
    border-radius:16px;
  "
>
<tr>
<td class="account-card" style="padding:24px;">

<p 
  class="account-title"
  style="
    margin:0 0 16px;
    font-size:12px;
    font-weight:bold;
    color:#222;
  "
>
  Account Information
</p>

<ul style="padding-left:18px;margin:0;color:#555;">

<li 
  class="list-text"
  style="
    margin-bottom:10px;
    line-height:1.8;
    font-size:12px;
  "
>
  <strong>Bootcamp:</strong>
  ${bootcamp.name}
</li>

<li 
  class="list-text"
  style="
    margin-bottom:10px;
    line-height:1.8;
    font-size:12px;
  "
>
  <strong>Email:</strong>
  ${user.email}
</li>

<li 
  class="list-text"
  style="
    line-height:1.8;
    font-size:12px;
  "
>
  <strong>Login Method:</strong>
  Secure OTP Verification
</li>

</ul>

</td>
</tr>
</table>

<!-- Button -->
<table width="100%" style="margin-top:32px;">
<tr>
<td align="center">

<a 
  href="${loginLink}"
  class="button"
  style="
    background:#ff6600;
    color:#ffffff;
    text-decoration:none;
    padding:14px 24px;
    border-radius:12px;
    font-weight:bold;
    display:inline-block;
    font-size:14px;
    line-height:1.2;
    box-sizing:border-box;
    max-width:100%;
  "
>
  Access Dashboard
</a>

</td>
</tr>
</table>

<!-- Footer -->
<table 
  width="100%" 
  style="
    margin-top:40px;
    border-top:1px solid #ececec;
  "
>
<tr>
<td align="center" style="padding-top:24px;">

<p 
  class="footer-text"
  style="
    margin:0;
    color:#888;
    font-size:12px;
    line-height:1.8;
  "
>
  Rixi Lab Technologies Bootcamp • Learn. Build. Grow.
</p>

<!-- Social Icons -->
<p style="margin:18px 0 0;">

<a
  href="https://www.instagram.com/rixilab.in"
  style="display:inline-block;margin:0 6px;"
>
  <img
    src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png"
    width="24"
    alt="Instagram"
  />
</a>

<a
  href="https://www.linkedin.com/company/rixilab"
  style="display:inline-block;margin:0 6px;"
>
  <img
    src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
    width="24"
    alt="LinkedIn"
  />
</a>

<a
  href="https://www.facebook.com/rixilab"
  style="display:inline-block;margin:0 6px;"
>
  <img
    src="https://cdn-icons-png.flaticon.com/512/733/733547.png"
    width="24"
    alt="Facebook"
  />
</a>

<a
  href="https://www.youtube.com/@RixiLab"
  style="display:inline-block;margin:0 6px;"
>
  <img
    src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
    width="24"
    alt="YouTube"
  />
</a>

</p>

<p
  class="footer-text"
  style="
    margin:18px 0 0;
    color:#999;
    font-size:11px;
    line-height:1.8;
  "
>
  © ${new Date().getFullYear()} Rixi Lab Technologies • ${BASE_URL}
</p>

</td>
</tr>
</table>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>

    `;
    const encodedMail = makeBody(user.email, `"Rixi Lab Technologies" <${process.env.PROJECT_INFO_EMAIL}>`, subject, body);
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
        const bootcamps = await Bootcamp.find({ status: { $in: ['live', 'closed'] } });
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
        if (!bootcamp || (bootcamp.status !== 'live' && bootcamp.status !== 'closed')) {
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
            req.flash('error', bootcamp && bootcamp.status === 'closed' ? 'Registration for this bootcamp is closed.' : 'Bootcamp not available.');
            return res.redirect(bootcamp ? `/bootcamps/${bootcamp._id}` : '/bootcamps');
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

            res.redirect(`/bootcamps/${bootcamp._id}?registered=true`);
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

            res.redirect(`/bootcamps/${bootcamp._id}?registered=true`);
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
