const express = require('express');
const router = express.Router();
const bootcampPublicController = require('../../controllers/public/bootcampPublicController');

// Public Bootcamp Listings
router.get('/', bootcampPublicController.getBootcamps);

// Bootcamp Details & Registration Page
router.get('/:id', bootcampPublicController.getBootcampDetails);

// Registration & Payment Initiation
router.post('/register/:id', bootcampPublicController.registerBootcamp);

// Payment Callback from Cashfree
router.get('/payment-callback', bootcampPublicController.paymentCallback);

module.exports = router;
