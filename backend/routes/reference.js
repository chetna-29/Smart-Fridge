const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const referenceController = require('../controllers/referenceController');

// Protect all reference routes
router.use(auth);

// Reference Endpoints
router.get('/search', referenceController.search);
router.get('/category/:category', referenceController.getByCategory);
router.get('/:id', referenceController.getById);

module.exports = router;
