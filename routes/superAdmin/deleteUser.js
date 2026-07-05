const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const deleteUserController = require('../../controllers/superAdmin/deleteUserController');

router.post("/delete-user/:id", authRole("superAdmin"), deleteUserController.deleteUser);

module.exports = router;