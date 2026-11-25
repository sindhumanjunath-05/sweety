const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/patients', doctorController.getAssignedPatients);
router.get('/patients/:patientId/reports', doctorController.getPatientReports);

module.exports = router;
