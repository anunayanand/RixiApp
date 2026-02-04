const express = require("express");
const router = express.Router();
const NewRegistration = require("../models/NewRegistration");
const User = require("../models/User");
const axios = require("axios");
const SHEET_URL = process.env.SHEET_URL;
const CASHFREE_BASE_URL = "https://api.cashfree.com/pg";
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

// Domain-wise registration charges
const DOMAIN_PRICES = {
  "Web Development": 102.4,
  "Python Programming": 102.4,
  "Java Programming": 102.4,
  "Data Analytics": 102.4,
  "DSA": 102.4,
  "Graphics Design": 102.4,
  "Full Stack Development": 102.4
};

router.post("/create-order", async (req, res) => {
  try {
    const data = req.body.data;

    // Extract fields
    const name = data["data[Name]"];
    const email = data["data[Email]"];
    const phone = data["data[Phone]"];
    const university = data["data[University]"];
    const college = data["data[College]"];
    const course = data["data[Course]"];
    const branch = data["data[Branch]"];
    const year_sem = data["data[Y/S]"];
    const domain = data["data[Domain]"];
    const duration = data["data[Duration]"];
    const referral_code = data["data[Referral_Code]"];
    const terms = data["data[Terms]"];

    // ✅ sanitize inputs
    const sanitizedEmail = email?.trim();
    const sanitizedPhone = phone?.toString().replace(/\D/g, "");

    // ✅ validate required fields
    if (
      !name ||
      !sanitizedEmail ||
      !sanitizedPhone ||
      !university ||
      !college ||
      !course ||
      !branch ||
      !year_sem ||
      !domain ||
      !duration ||
      !terms
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // ✅ validate phone
    if (sanitizedPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number",
      });
    }

    // Check if email already exists
    if (await User.findOne({ email: sanitizedEmail })) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const orderId = `order_${Date.now()}`;

    // Get price based on domain
    const domainPrice = DOMAIN_PRICES[domain.trim()] || 100;

    // Create dummy registration
    const newReg = new NewRegistration({
      name: name.trim(),
      email: sanitizedEmail,
      phone: sanitizedPhone,
      university: university.trim(),
      college: college.trim(),
      course: course.trim(),
      branch: branch.trim(),
      year_sem: year_sem.trim(),
      domain: domain.trim(),
      duration: parseInt(duration) || 4,
      referral_code: referral_code ? referral_code.trim() : "",
      payID: "",
      order_id: orderId,
      terms: terms === "on",
    });

    await newReg.save();

    const request = {
      order_id: orderId,
      order_amount: domainPrice,
      order_currency: "INR",

      customer_details: {
        customer_id: `cust_${Date.now()}`, // ✅ REQUIRED
        customer_name: name,
        customer_email: sanitizedEmail, // ✅ recommended
        customer_phone: sanitizedPhone, // ✅ recommended
      },

      order_meta: {
        return_url: `${process.env.BASE_URL}/internship/payment/callback?order_id=${orderId}`,
      },
    };

    // console.log("Cashfree Request:", request);

    const response = await axios.post(`${CASHFREE_BASE_URL}/orders`, request, {
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
      },
    });

    const paymentSessionId = response.data.payment_session_id;
    if (!paymentSessionId) {
      throw new Error("Payment session ID not received from Cashfree");
    }

    res.json({
      success: true,
      order_id: orderId,
      payment_session_id: paymentSessionId,
    });
  } catch (error) {
    console.error("Cashfree Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
});

router.get("/payment/callback", async (req, res) => {
  try {
    const { order_id } = req.query;
    if (!order_id) {
      return res.redirect("/internship?payment_success=false");
    }
    // Verify payment
    const response = await axios.get(
      `${CASHFREE_BASE_URL}/orders/${order_id}/payments`,
      {
        headers: {
          "x-api-version": "2023-08-01",
          "x-client-id": CASHFREE_APP_ID,
          "x-client-secret": CASHFREE_SECRET_KEY,
        },
      }
    );
    const payments = response.data;
    const payment = payments[0];
    if (payment && payment.payment_status === "SUCCESS") {
      const invoiceUrl = payment.invoice_url || "";
      const transactionId = payment.cf_payment_id || order_id; // Use cf_payment_id as transaction_id, fallback to order_id

      // Find and update by order_id
      const registration = await NewRegistration.findOneAndUpdate(
        { order_id: order_id },
        { payID: transactionId, payment_status: "SUCCESS" },
        { new: true }
      );

      if (registration) {
        // Send to sheets
        const d = new Date();

        const formattedTimestamp = d
          .toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
          .replace(",", "");

        const sheetData = {
          Name: registration.name,
          Email: registration.email,
          Phone: registration.phone,
          University: registration.university,
          College: registration.college,
          Course: registration.course,
          Branch: registration.branch,
          "Y/S": registration.year_sem,
          Domain: registration.domain,
          Duration: registration.duration,
          Referral_Code: registration.referral_code,
          PayID: registration.payID,
          Terms: registration.terms ? "Yes" : "No",
          Timestamp: formattedTimestamp,
        };

        try {
          await axios.post(SHEET_URL, {
            data: sheetData,
          });
        } catch (sheetError) {
          console.error("Failed to send to sheet:", sheetError.message);
        }
      }

      res.redirect(
        "/internship?payment_success=true&order_id=" +
          order_id +
          "&transaction_id=" +
          transactionId +
          "&invoice_url=" +
          encodeURIComponent(invoiceUrl)
      );
    } else {
      await NewRegistration.findOneAndUpdate(
        { order_id },
        { payment_status: "FAILED" }
      );
      res.redirect("/internship?payment_success=false");
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.redirect("/internship?payment_success=false");
  }
});

module.exports = router;
