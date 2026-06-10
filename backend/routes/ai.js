const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiController = require('../controllers/aiController');

// Protect all AI routes
router.use(auth);

// AI Endpoints
router.get('/dashboard', aiController.getDashboardData);
router.get('/notifications', aiController.getNotifications);

module.exports = router;
