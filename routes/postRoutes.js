const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.post('/', postController.schedulePost);

// GET /api/post/:projectId -> Projeye ait zamanlanmış postları listeler
router.get('/:projectId', postController.getScheduledPostsByProject);
router.put('/reschedule/:id', postController.updatePostSchedule);

module.exports = router;