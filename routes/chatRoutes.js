const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', upload.single('reference_image'), chatController.sendMessage);

// n8n otomasyonundan gelen video URL callback'i
router.post('/n8n-callback', chatController.n8nCallback);

// Kullanıcının tüm sohbetlerinin özeti (Chat History sayfası - session bazlı)
router.get('/user/:userId', chatController.getUserChatHistory);

// Son aktif session (504 timeout kurtarma)
router.get('/user/:userId/latest-session', chatController.getLatestSession);

// Session ID'ye göre o sohbetin tüm mesajları
router.get('/session/:sessionId', chatController.getChatHistoryBySession);

// Proje için orijinal sohbet session_id'sini bul ("Sohbete Devam Et")
router.get('/find-session/:projectId', chatController.findSessionByProject);

// Proje ID'ye göre o projenin chat geçmişi
router.get('/:projectId', chatController.getChatHistory);

router.delete('/:projectId', chatController.clearChatHistory);

// Kullanıcıya ait tüm veya belirli bir tarihteki sohbet geçmişini temizle
router.delete('/user/:userId', chatController.clearUserChatHistoryByDate);

module.exports = router;
