const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const authRole = require('../middleware/authRole');

const CASHFREE_BASE_URL = "https://api.cashfree.com/pg";
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CERT_PRICE = 9;

router.post('/cert-payment/create-order', authRole('intern'), async (req, res) => {
    try {
        const intern = await User.findById(req.session.user);
        if (!intern) return res.status(404).json({ success: false, message: "Intern not found" });

        const orderId = `cert_${intern._id}_${Date.now()}`;
        const finalAmount = CERT_PRICE;

        const request = {
            order_id: orderId,
            order_amount: finalAmount,
            order_currency: "INR",
            customer_details: {
                customer_id: `cust_${intern._id}`,
                customer_name: intern.name,
                customer_email: intern.email || "no-email@rixilab.tech",
                customer_phone: intern.phone || "9999999999"
            },
            order_meta: {
                return_url: `${process.env.BASE_URL}/cert-payment/callback?order_id=${orderId}`
            }
        };

        const response = await axios.post(`${CASHFREE_BASE_URL}/orders`, request, {
            headers: {
                "Content-Type": "application/json",
                "x-api-version": "2023-08-01",
                "x-client-id": CASHFREE_APP_ID,
                "x-client-secret": CASHFREE_SECRET_KEY
            }
        });

        const paymentSessionId = response.data.payment_session_id;
        if (!paymentSessionId) throw new Error("Payment session ID not received");

        res.json({ success: true, order_id: orderId, payment_session_id: paymentSessionId });
    } catch (err) {
        console.error("Certificate Payment Error:", err.response?.data || err.message);
        res.status(500).json({ success: false, message: "Failed to create order" });
    }
});

router.get('/cert-payment/callback', async (req, res) => {
    try {
        const { order_id } = req.query;
        if (!order_id) return res.redirect("/intern?payment_success=false");

        const response = await axios.get(`${CASHFREE_BASE_URL}/orders/${order_id}/payments`, {
            headers: {
                "x-api-version": "2023-08-01",
                "x-client-id": CASHFREE_APP_ID,
                "x-client-secret": CASHFREE_SECRET_KEY
            }
        });

        const payments = response.data;
        const payment = payments[0];
        
        if (payment && payment.payment_status === "SUCCESS") {
            const internId = order_id.split('_')[1];
            const transactionId = payment.cf_payment_id || order_id;

            const intern = await User.findById(internId);
            if (intern) {
                intern.certificatePurchased = true;
                intern.certificatePaymentId = transactionId;
                // Since they might not have a completion_date yet, let's just make sure they are passed 
                intern.isPassed = true; 
                if (!intern.completion_date) intern.completion_date = new Date();
                await intern.save();
                req.flash("success", "Certificate purchased successfully! You can now download it.");
            }
            res.redirect("/intern");
        } else {
            req.flash("error", "Payment failed or was cancelled.");
            res.redirect("/intern");
        }
    } catch (err) {
        console.error("Certificate Callback Error:", err.response?.data || err.message);
        req.flash("error", "An error occurred during payment verification.");
        res.redirect("/intern");
    }
});

module.exports = router;
