const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/public/chatController');

router.post('/api/chat', chatController.postChat);

module.exports = router;
