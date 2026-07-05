const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const certPaymentController = require('../../controllers/intern/certPaymentController');

router.post('/cert-payment/create-order', authRole('intern'), certPaymentController.createCertOrder);

router.get('/cert-payment/callback', certPaymentController.certPaymentCallback);

module.exports = router;
