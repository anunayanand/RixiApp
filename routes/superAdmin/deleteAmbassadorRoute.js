const express = require('express');
const router = express.Router();
const authRole = require('../../middleware/authRole');
const deleteAmbassadorController = require('../../controllers/superAdmin/deleteAmbassadorController');

router.post("/delete-ambassador/:id", authRole("superAdmin"), deleteAmbassadorController.deleteAmbassador);

module.exports = router;
