const { query } = require('../config/db');
const {
  getDailyRange,
  getMonthToDateRange,
  getPreviousMonthRange,
  calculateStats,
} = require('../utils/dateUtils');
const { getTodayDateString } = require('../utils/validation');

const normalizeDate = (d) => {
  if (!d) return '';
  if (typeof d === 'string') return d.substring(0, 10);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Middleware or check to ensure user is a doctor
 */
const ensureDoctor = (req, res) => {
  if (req.user.role !== 'doctor') {
    res.status(403).json({ error: 'Access denied. Doctor account required.' });
    return false;
  }
  return true;
};

/**
 * Get all patients assigned to the current doctor
 * GET /api/doctor/patients
 */
const getAssignedPatients = async (req, res, next) => {
  try {
    if (!ensureDoctor(req, res)) return;

    const doctorId = req.user.id;

    const result = await query(
      `SELECT
        u.id,
        u.name,
        u.email,
        dp.created_at AS assigned_at,
        (SELECT COUNT(*) FROM readings r WHERE r.user_id = u.id) AS total_readings,
        (SELECT r.value FROM readings r WHERE r.user_id = u.id ORDER BY r.date DESC, r.created_at DESC LIMIT 1) AS latest_reading_value,
        (SELECT r.date FROM readings r WHERE r.user_id = u.id ORDER BY r.date DESC, r.created_at DESC LIMIT 1) AS latest_reading_date
       FROM doctor_patients dp
       JOIN users u ON dp.patient_id = u.id
       WHERE dp.doctor_id = $1
       ORDER BY u.name ASC`,
      [doctorId]
    );

    const patients = result.rows.map((p) => ({
      ...p,
      latest_reading_date: normalizeDate(p.latest_reading_date),
      total_readings: parseInt(p.total_readings || '0', 10),
    }));

    return res.json({ patients });
  } catch (error) {
    next(error);
  }
};

/**
 * Get reports for a specific patient assigned to the doctor
 * GET /api/doctor/patients/:patientId/reports?date=2026-10-15
 */
const getPatientReports = async (req, res, next) => {
  try {
    if (!ensureDoctor(req, res)) return;

    const doctorId = req.user.id;
    const { patientId } = req.params;
    const selectedDate = req.query.date || getTodayDateString();

    // Verify patient assignment
    const verifyAssignment = await query(
      `SELECT u.id, u.name, u.email
       FROM doctor_patients dp
       JOIN users u ON dp.patient_id = u.id
       WHERE dp.doctor_id = $1 AND dp.patient_id = $2`,
      [doctorId, patientId]
    );

    if (verifyAssignment.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found or not assigned to your account.' });
    }

    const patient = verifyAssignment.rows[0];

    // Helper to fetch patient readings
    const fetchRange = async (start, end) => {
      const resData = await query(
        `SELECT id, user_id, date, slot, value, created_at
         FROM readings
         WHERE user_id = $1 AND date >= $2 AND date <= $3
         ORDER BY date ASC,
           CASE slot
             WHEN 'Morning (fasting)' THEN 1
             WHEN 'After breakfast' THEN 2
             WHEN 'After lunch' THEN 3
             WHEN 'After dinner' THEN 4
             ELSE 5
           END ASC`,
        [patientId, start, end]
      );
      return resData.rows.map((r) => ({
        ...r,
        date: normalizeDate(r.date),
        value: Number(r.value),
      }));
    };

    // Daily
    const dailyRange = getDailyRange(selectedDate);
    const dailyReadings = await fetchRange(dailyRange.startDate, dailyRange.endDate);
    const dailyStats = calculateStats(dailyReadings);

    // MTD
    const mtdRange = getMonthToDateRange(selectedDate);
    const mtdReadings = await fetchRange(mtdRange.startDate, mtdRange.endDate);
    const mtdStats = calculateStats(mtdReadings);

    // Monthly (Previous Month)
    const monthlyRange = getPreviousMonthRange(selectedDate);
    const monthlyReadings = await fetchRange(monthlyRange.startDate, monthlyRange.endDate);
    const monthlyStats = calculateStats(monthlyReadings);

    return res.json({
      patient,
      selectedDate,
      daily: {
        ...dailyRange,
        ...dailyStats,
        readings: dailyReadings,
      },
      monthToDate: {
        ...mtdRange,
        ...mtdStats,
        readings: mtdReadings,
      },
      monthly: {
        ...monthlyRange,
        ...monthlyStats,
        readings: monthlyReadings,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssignedPatients,
  getPatientReports,
};
