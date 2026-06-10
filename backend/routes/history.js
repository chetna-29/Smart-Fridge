const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  exportHistory,
  getHistory,
  getHistoryRecord,
  getHistoryStats,
  getMonthlyHistory,
  getRecentHistory,
  getTopHistoryItems,
} = require('../controllers/historyController');

router.use(auth);

router.get('/', getHistory);
router.get('/recent', getRecentHistory);
router.get('/stats', getHistoryStats);
router.get('/monthly', getMonthlyHistory);
router.get('/top-items', getTopHistoryItems);
router.get('/export', exportHistory);
router.get('/:id', getHistoryRecord);

module.exports = router;
