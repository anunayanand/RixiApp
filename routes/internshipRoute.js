const express = require("express");
const router = express.Router();
const NewRegistration = require("../models/NewRegistration");
const User = require("../models/User");
const axios = require("axios");
const SHEET_URL = process.env.SHEET_URL;
router.post("/register", async (req, res) => {
  try {
    // console.log(req.body);
    const name = req.body["data[Name]"];
    const email = req.body["data[Email]"];
    const phone = req.body["data[Phone]"];
    const university = req.body["data[University]"];
    const college = req.body["data[College]"];
    const course = req.body["data[Course]"];
    const branch = req.body["data[Branch]"];
    const year_sem = req.body["data[Y/S]"];
    const domain = req.body["data[Domain]"];
    const duration = req.body["data[Duration]"];
    const referral_code = req.body["data[Referral_Code]"];
    const payID = req.body["data[PayID]"];
    const terms = req.body["data[Terms]"];

    // Validate required fields
    if (
      !name ||
      !email ||
      !phone ||
      !university ||
      !college ||
      !course ||
      !branch ||
      !year_sem ||
      !domain ||
      !duration ||
      !payID ||
      !terms
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "All required fields must be filled",
        });
    }
    if (
      (await User.findOne({ email: email })) ||
      (await NewRegistration.findOne({ email: email }))
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }
    // Save to NewRegistration
    const newReg = new NewRegistration({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      university: university.trim(),
      college: college.trim(),
      course: course.trim(),
      branch: branch.trim(),
      year_sem: year_sem.trim(),
      domain: domain.trim(),
      duration: parseInt(duration) || 4,
      referral_code: referral_code ? referral_code.trim() : "",
      payID: payID.trim(),
      terms: terms === "on",
    });

    await newReg.save();
    const timestampMs = Date.now();
    const d = new Date(timestampMs);

    const pad = (n) => String(n).padStart(2, "0");

    let hours = d.getHours();
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12; // 0 -> 12

    const formattedTimestamp =
      `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
      `${pad(hours)}:${minutes}:${seconds} ${ampm}`;

    // Send to sheets
    const sheetData = {
      Name: name.trim(),
      Email: email.trim(),
      Phone: phone.trim(),
      University: university.trim(),
      College: college.trim(),
      Course: course.trim(),
      Branch: branch.trim(),
      "Y/S": year_sem.trim(),
      Domain: domain.trim(),
      Duration: parseInt(duration) || 4,
      Referral_Code: referral_code ? referral_code.trim() : "",
      PayID: payID.trim(),
      Terms: terms === "on" ? "Yes" : "No",
      Timestamp: formattedTimestamp,
    };

    await axios.post(SHEET_URL, {
      data: sheetData,
    });

    res.json({
      success: true,
      message: "Registration submitted successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
