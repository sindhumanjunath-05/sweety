const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authenticateToken } = require('../middleware/auth');

// All report routes require authentication
router.use(authenticateToken);

router.get('/', reportsController.getReports);
router.get('/daily', reportsController.getDailyReport);
router.get('/month-to-date', reportsController.getMonthToDateReport);
router.get('/monthly', reportsController.getMonthlyReport);

module.exports = router;
