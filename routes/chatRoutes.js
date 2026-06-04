const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/', chatController.sendMessage);

// n8n otomasyonundan gelen video URL callback'i
router.post('/n8n-callback', chatController.n8nCallback);

// Kullanıcının tüm sohbetlerinin özeti (Chat History sayfası - session bazlı)
router.get('/user/:userId', chatController.getUserChatHistory);

// Session ID'ye göre o sohbetin tüm mesajları
router.get('/session/:sessionId', chatController.getChatHistoryBySession);

// Proje için orijinal sohbet session_id'sini bul ("Sohbete Devam Et")
router.get('/find-session/:projectId', chatController.findSessionByProject);

// Proje ID'ye göre o projenin chat geçmişi
router.get('/:projectId', chatController.getChatHistory);

router.delete('/:projectId', chatController.clearChatHistory);

module.exports = router;