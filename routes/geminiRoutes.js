const express = require('express');
const router = express.Router();
const { generateBrandPrompt, reviseImage } = require('../controllers/geminiController');

// POST /api/gemini/generate-prompt
router.post('/generate-prompt', generateBrandPrompt);

// POST /api/gemini/revise-image
router.post('/revise-image', reviseImage);

module.exports = router;
