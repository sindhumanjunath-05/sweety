/**
 * Date utility helpers for reports and date range calculations
 */

/**
 * Format a Date object to YYYY-MM-DD
 */
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses YYYY-MM-DD to a local Date object safely avoiding timezone offsets
 */
const parseDateParts = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
};

/**
 * Get date range for Daily report
 */
const getDailyRange = (selectedDate) => {
  return {
    startDate: selectedDate,
    endDate: selectedDate,
  };
};

/**
 * Get date range for Month-to-date report:
 * 1st of the selected month to the selected date
 */
const getMonthToDateRange = (selectedDate) => {
  const { year, month } = parseDateParts(selectedDate);
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  return {
    startDate,
    endDate: selectedDate,
  };
};

/**
 * Get date range for Monthly report (The whole previous month):
 * Example: if selected date is 2026-10-15 -> 2026-09-01 to 2026-09-30
 */
const getPreviousMonthRange = (selectedDate) => {
  const { year, month } = parseDateParts(selectedDate);
  
  // Previous month calculation
  let prevYear = year;
  let prevMonth = month - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear -= 1;
  }

  const startDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  
  // Last day of previous month: day 0 of month gives last day of prevMonth
  const lastDayDate = new Date(prevYear, prevMonth, 0);
  const lastDay = String(lastDayDate.getDate()).padStart(2, '0');
  const endDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${lastDay}`;

  return {
    startDate,
    endDate,
  };
};

/**
 * Calculates highest, lowest, average (rounded to 1 decimal), and count
 */
const calculateStats = (readings) => {
  if (!readings || readings.length === 0) {
    return {
      count: 0,
      highest: null,
      lowest: null,
      average: null,
    };
  }

  const values = readings.map((r) => Number(r.value));
  const highest = Math.max(...values);
  const lowest = Math.min(...values);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = Number((sum / values.length).toFixed(1));

  return {
    count: readings.length,
    highest,
    lowest,
    average,
  };
};

module.exports = {
  formatDate,
  parseDateParts,
  getDailyRange,
  getMonthToDateRange,
  getPreviousMonthRange,
  calculateStats,
};
