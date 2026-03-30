const express = require("express");
const router = express.Router();
const NewRegistration = require("../models/NewRegistration");
const User = require("../models/User");
const Ambassador = require("../models/Ambassador");
const axios = require("axios");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

const SHEET_URL = process.env.SHEET_URL;
const CASHFREE_BASE_URL = "https://api.cashfree.com/pg";
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

// Cloudinary storage for profile images
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "intern_profiles",
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 300, height: 300, crop: "fill" }]
  }
});

const uploadProfile = multer({ storage: profileStorage });

// Profile image upload endpoint
router.post("/upload-profile-image", uploadProfile.single("profileImage"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }
    
    res.json({
      success: true,
      imageUrl: req.file.path,
      publicId: req.file.filename
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ success: false, message: "Failed to upload image" });
  }
});

// Domain-wise registration charges
const DOMAIN_PRICES = {
  "Web Development": 100,
  "Data Analytics": 150,
  "DSA": 124,
  "Graphics Design": 100,
  "Python Programming": 149,
  "Java Programming": 174,
  "Full Stack Development": 124,
  "Machine Learning": 200
};

// Helper function to convert text to Title Case
const toTitleCase = (str) => {
  if (!str) return str;
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

router.get("/get-price-info", (req, res) => {
  res.json({ success: true, domainPrices: DOMAIN_PRICES });
});

router.post("/validate-referral", async (req, res) => {
  try {
    const { referralCode } = req.body;
    if (!referralCode) {
       return res.json({ valid: false, message: "No referral code provided" });
    }
    const ambassador = await Ambassador.findOne({ referralId: referralCode.trim() });
    if (ambassador) {
      return res.json({ valid: true, discountPercent: ambassador.discountPercent || 0 });
    }
    return res.json({ valid: false, message: "Invalid referral code" });
  } catch (err) {
    console.error("Referral validation error:", err);
    return res.status(500).json({ valid: false, message: "Server error" });
  }
});

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
    
    // Extract profile image data
    const profileImageUrl = data["data[ProfileImageUrl]"] || "https://i.pinimg.com/736x/e6/31/f1/e631f170b5dfc882ed2845b521653ecb.jpg";
    const profileImagePublicId = data["data[ProfileImagePublicId]"] || "";

    // ✅ sanitize inputs
    const sanitizedName = name ? toTitleCase(name.trim()) : name;
    const sanitizedUniversity = university ? toTitleCase(university.trim()) : university;
    const sanitizedCollege = college ? toTitleCase(college.trim()) : college;
    const sanitizedEmail = email?.trim();
    const sanitizedPhone = phone?.toString().replace(/\D/g, "");

    // ✅ validate required fields
    if (
      !sanitizedName ||
      !sanitizedEmail ||
      !sanitizedPhone ||
      !sanitizedUniversity ||
      !sanitizedCollege ||
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

    // Get base amount from domain prices
    const baseAmount = DOMAIN_PRICES[domain.trim()] || 100;

    // Apply referral discount
    let discountPercent = 0;
    if (referral_code && referral_code.trim() !== "") {
      const ambassador = await Ambassador.findOne({ referralId: referral_code.trim() });
      if (ambassador && ambassador.discountPercent) {
        discountPercent = ambassador.discountPercent;
      }
    }
    
    let discountAmount = Number(((baseAmount * discountPercent) / 100).toFixed(2));
    let discountedBase = baseAmount - discountAmount;
    
    let serviceCharge = Number((discountedBase * 0.0195).toFixed(2));
    let gst = Number((serviceCharge * 0.18).toFixed(2));
    
    let finalAmount = Number((discountedBase + serviceCharge + gst).toFixed(2));

    // Ensure final amount is at least 1 INR for Cashfree
    if (finalAmount < 1) {
      finalAmount = 1;
      discountAmount = domainPrice - 1;
    }

    // Create registration with profile image
    const newReg = new NewRegistration({
      name: sanitizedName,
      email: sanitizedEmail,
      phone: sanitizedPhone,
      university: sanitizedUniversity,
      college: sanitizedCollege,
      course: course.trim(),
      branch: branch.trim(),
      year_sem: year_sem.trim(),
      domain: domain.trim(),
      duration: parseInt(duration) || 4,
      referral_code: referral_code ? referral_code.trim() : "",
      payID: "",
      order_id: orderId,
      terms: terms === "on",
      profile_image_url: profileImageUrl,
      profile_image_public_id: profileImagePublicId,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      final_amount: finalAmount
    });

    await newReg.save();

    const request = {
      order_id: orderId,
      order_amount: finalAmount, //domainPrice,
      order_currency: "INR",

      customer_details: {
        customer_id: `cust_${Date.now()}`, // ✅ REQUIRED
        customer_name: sanitizedName,
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
