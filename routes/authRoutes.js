const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const authController = require('../controllers/authController');

router.post('/login', authController.login);

router.post('/delete-profile', authController.deleteProfile);

router.get('/profile/:firebase_uid', authController.getProfile);

router.post('/update-profile', authController.updateProfile);

router.post('/upload-profile-photo', upload.single('photo'), authController.uploadProfilePhoto);

module.exports = router;