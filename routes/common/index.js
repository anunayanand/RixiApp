const express = require('express');
const router = express.Router();

const { router: profileRoute } = require('./profileRoute');
const updateImageRoute = require('./updateImageRoute');
const heartbeatRoute = require('./heartbeatRoute');
const mobileBlockedRoute = require('./mobileBlockedRoute');

router.use('/profile', profileRoute);
router.use('/', updateImageRoute);
router.use('/', heartbeatRoute);
router.use('/', mobileBlockedRoute);

module.exports = router;
