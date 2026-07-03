const express = require('express');
const router = express.Router();

const homeRoute = require('./homeRoute');
const verifyCertificateRouter = require('./verifyCertificateRouter');
const downloadCertificateRoute = require('./downloadCertificateRoute');
const downloadOfferLetterRoute = require('./downloadOfferLetterRoute');
const internshipRoute = require('./internshipRoute');
const bootcampPublicRoute = require('./bootcampPublicRoute');
const feedbackRoute = require('./feedbackRoute');
const chatRoute = require('./chatRoute');

// Inline routes from app.js
router.get("/cap", (req, res) => res.render("cap"));
router.get("/internship", (req, res) => res.render("internship"));
router.get("/certificate", (req, res) => res.render("certificate", { query: req.query || {} }));
router.get("/bootcamp", (req, res) => res.redirect("/bootcamps"));

router.use('/', homeRoute);
router.use('/', verifyCertificateRouter);
router.use('/', downloadCertificateRoute);
router.use('/', downloadOfferLetterRoute);
router.use('/internship', internshipRoute);
router.use('/bootcamps', bootcampPublicRoute);
router.use('/', feedbackRoute);
router.use('/', chatRoute);

module.exports = router;
