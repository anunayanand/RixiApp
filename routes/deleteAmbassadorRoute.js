const express = require('express');
const router = express.Router();
const Ambassador = require("../models/Ambassador");
const authRole = require('../middleware/authRole');

router.post("/delete-ambassador/:id", authRole("superAdmin"), async (req, res) => {
  try {
    const ambassador = await Ambassador.findById(req.params.id);

    if (!ambassador) {
      return res.json({ success: false, message: 'Ambassador not found' });
    }

    await Ambassador.findByIdAndDelete(req.params.id);

    return res.json({ success: true, message: `Ambassador "${ambassador.name}" Deleted Successfully!` });
  } catch (err) {
    // console.error(err);
    return res.json({ success: false, message: 'Failed to Delete Ambassador' });
  }
});

module.exports = router;
