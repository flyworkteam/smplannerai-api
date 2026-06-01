const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/', chatController.sendMessage);

// n8n otomasyonundan gelen video URL callback'i
router.post('/n8n-callback', chatController.n8nCallback);

// Kullanıcının tüm projelerindeki geçmiş (Chat History sayfası)
router.get('/user/:userId', chatController.getUserChatHistory);

router.get('/:projectId', chatController.getChatHistory);

router.delete('/:projectId', chatController.clearChatHistory);

module.exports = router;