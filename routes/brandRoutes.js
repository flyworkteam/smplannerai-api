const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');

router.post('/', brandController.createBrandKit);
router.get('/:userId', brandController.getBrandKitsByUserId);
router.get('/detail/:id', brandController.getBrandKitById);
router.put('/:id', brandController.updateBrandKit);
router.delete('/:id', brandController.deleteBrandKit);

module.exports = router;