const express = require('express');
const router = express.Router();
const revenueCatController = require('../controllers/revenueCatController');

router.post('/revenuecat', revenueCatController.handleWebhook);

module.exports = router;
