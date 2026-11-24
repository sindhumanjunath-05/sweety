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
 * Fetch readings for a user within a date range
 */
const fetchReadingsInRange = async (userId, startDate, endDate) => {
  const result = await query(
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
    [userId, startDate, endDate]
  );

  return result.rows.map((row) => ({
    ...row,
    date: normalizeDate(row.date),
    value: Number(row.value),
  }));
};

/**
 * Get comprehensive reports for a selected date
 * GET /api/reports?date=2026-10-15
 */
const getReports = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || getTodayDateString();

    // 1. Daily Report range (selected date)
    const dailyRange = getDailyRange(selectedDate);
    const dailyReadings = await fetchReadingsInRange(
      userId,
      dailyRange.startDate,
      dailyRange.endDate
    );
    const dailyStats = calculateStats(dailyReadings);

    // 2. Month-to-date Report range (1st of month to selected date)
    const mtdRange = getMonthToDateRange(selectedDate);
    const mtdReadings = await fetchReadingsInRange(
      userId,
      mtdRange.startDate,
      mtdRange.endDate
    );
    const mtdStats = calculateStats(mtdReadings);

    // 3. Monthly Report range (whole previous month)
    const prevMonthRange = getPreviousMonthRange(selectedDate);
    const prevMonthReadings = await fetchReadingsInRange(
      userId,
      prevMonthRange.startDate,
      prevMonthRange.endDate
    );
    const prevMonthStats = calculateStats(prevMonthReadings);

    return res.json({
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
        ...prevMonthRange,
        ...prevMonthStats,
        readings: prevMonthReadings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single Daily report
 * GET /api/reports/daily?date=2026-10-15
 */
const getDailyReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || getTodayDateString();
    const range = getDailyRange(selectedDate);
    const readings = await fetchReadingsInRange(userId, range.startDate, range.endDate);
    const stats = calculateStats(readings);

    return res.json({
      selectedDate,
      ...range,
      ...stats,
      readings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single Month-to-date report
 * GET /api/reports/month-to-date?date=2026-10-15
 */
const getMonthToDateReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || getTodayDateString();
    const range = getMonthToDateRange(selectedDate);
    const readings = await fetchReadingsInRange(userId, range.startDate, range.endDate);
    const stats = calculateStats(readings);

    return res.json({
      selectedDate,
      ...range,
      ...stats,
      readings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single Monthly report (Whole previous month)
 * GET /api/reports/monthly?date=2026-10-15
 */
const getMonthlyReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const selectedDate = req.query.date || getTodayDateString();
    const range = getPreviousMonthRange(selectedDate);
    const readings = await fetchReadingsInRange(userId, range.startDate, range.endDate);
    const stats = calculateStats(readings);

    return res.json({
      selectedDate,
      ...range,
      ...stats,
      readings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReports,
  getDailyReport,
  getMonthToDateReport,
  getMonthlyReport,
};
