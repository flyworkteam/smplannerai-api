const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const multer = require('multer');

// Resim yükleme için bellek depolama (memoryStorage) ayarı
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', projectController.createProject);
router.get('/:userId', projectController.getProjects);
router.put('/:projectId', projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);
router.post('/:projectId/upload', upload.single('project_image'), projectController.uploadProjectImage);
router.get('/:projectId/items', projectController.getProjectItems);
router.post('/:projectId/items', projectController.addProjectItem);
router.delete('/items/:itemId', projectController.deleteProjectItem);

module.exports = router;