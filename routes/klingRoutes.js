const express = require('express');
const router = express.Router();
const klingController = require('../controllers/klingController');

// n8n tarafından çağrılır – taze Kling Bearer token döner
router.get('/token', klingController.getToken);

module.exports = router;
