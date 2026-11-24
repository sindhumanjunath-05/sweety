const { query } = require('../config/db');
const {
  validateReadingPayload,
  getDuplicateSlotMessage,
  ALLOWED_SLOTS,
} = require('../utils/validation');

/**
 * Normalizes PostgreSQL date string (which may come as Date object or string)
 */
const normalizeDate = (d) => {
  if (!d) return '';
  if (typeof d === 'string') {
    return d.substring(0, 10);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Helper to sort readings logically by slot order within a day
 */
const slotOrder = {
  'Morning (fasting)': 1,
  'After breakfast': 2,
  'After lunch': 3,
  'After dinner': 4,
};

/**
 * Get all readings for authenticated user with optional pagination & date filters
 * GET /api/readings?page=1&limit=20&date=2026-10-15&startDate=...&endDate=...
 */
const getReadings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit, date, startDate, endDate, slot } = req.query;

    const conditions = ['user_id = $1'];
    const params = [userId];

    if (date) {
      params.push(date);
      conditions.push(`date = $${params.length}`);
    } else {
      if (startDate) {
        params.push(startDate);
        conditions.push(`date >= $${params.length}`);
      }
      if (endDate) {
        params.push(endDate);
        conditions.push(`date <= $${params.length}`);
      }
    }

    if (slot && ALLOWED_SLOTS.includes(slot)) {
      params.push(slot);
      conditions.push(`slot = $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    // Check if pagination is requested
    const isPaginated = page !== undefined || limit !== undefined;
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '20', 10)));
    const offset = (pageNum - 1) * limitNum;

    // Total count query
    const countResult = await query(
      `SELECT COUNT(*) AS total FROM readings WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Main query
    let sql = `
      SELECT id, user_id, date, slot, value, created_at, updated_at
      FROM readings
      WHERE ${whereClause}
      ORDER BY date DESC,
        CASE slot
          WHEN 'Morning (fasting)' THEN 1
          WHEN 'After breakfast' THEN 2
          WHEN 'After lunch' THEN 3
          WHEN 'After dinner' THEN 4
          ELSE 5
        END ASC
    `;

    if (isPaginated) {
      params.push(limitNum);
      sql += ` LIMIT $${params.length}`;
      params.push(offset);
      sql += ` OFFSET $${params.length}`;
    }

    const result = await query(sql, params);

    const formattedReadings = result.rows.map((row) => ({
      ...row,
      date: normalizeDate(row.date),
      value: Number(row.value),
    }));

    if (isPaginated) {
      return res.json({
        readings: formattedReadings,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      });
    }

    return res.json({
      readings: formattedReadings,
      total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single reading by ID
 * GET /api/readings/:id
 */
const getReadingById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      'SELECT id, user_id, date, slot, value, created_at, updated_at FROM readings WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    const row = result.rows[0];
    return res.json({
      reading: {
        ...row,
        date: normalizeDate(row.date),
        value: Number(row.value),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new blood glucose reading
 * POST /api/readings
 */
const createReading = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { date, slot, value } = req.body;

    // 1. Basic validation rules
    const validation = validateReadingPayload({ date, slot, value });
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    }

    const cleanDate = date.trim();
    const cleanSlot = slot.trim();
    const numericValue = Math.round(Number(value));

    // 2. Business rule: Check if reading for slot on date already exists
    const duplicateSlotCheck = await query(
      'SELECT id FROM readings WHERE user_id = $1 AND date = $2 AND slot = $3',
      [userId, cleanDate, cleanSlot]
    );

    if (duplicateSlotCheck.rows.length > 0) {
      return res.status(400).json({
        error: getDuplicateSlotMessage(cleanSlot),
      });
    }

    // 3. Business rule: Maximum 4 readings per day
    const dayCountResult = await query(
      'SELECT COUNT(*) AS count FROM readings WHERE user_id = $1 AND date = $2',
      [userId, cleanDate]
    );

    const dayCount = parseInt(dayCountResult.rows[0].count, 10);
    if (dayCount >= 4) {
      return res.status(400).json({
        error: 'You can add only 4 readings per day.',
      });
    }

    // Insert reading
    const insertResult = await query(
      `INSERT INTO readings (user_id, date, slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, date, slot, value, created_at, updated_at`,
      [userId, cleanDate, cleanSlot, numericValue]
    );

    const newReading = insertResult.rows[0];

    return res.status(201).json({
      message: 'Reading added successfully.',
      reading: {
        ...newReading,
        date: normalizeDate(newReading.date),
        value: Number(newReading.value),
      },
    });
  } catch (error) {
    // Handle database unique constraint violation gracefully if race condition occurs
    if (error.code === '23505') {
      return res.status(400).json({
        error: getDuplicateSlotMessage(req.body.slot),
      });
    }
    next(error);
  }
};

/**
 * Edit an existing reading
 * PUT /api/readings/:id
 */
const updateReading = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { date, slot, value } = req.body;

    // Verify reading exists and belongs to user
    const existingCheck = await query(
      'SELECT id, date, slot, value FROM readings WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    const currentReading = existingCheck.rows[0];
    const targetDate = date ? date.trim() : normalizeDate(currentReading.date);
    const targetSlot = slot ? slot.trim() : currentReading.slot;
    const targetValue = value !== undefined ? value : currentReading.value;

    // Validate payload
    const validation = validateReadingPayload({
      date: targetDate,
      slot: targetSlot,
      value: targetValue,
    });

    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors[0], errors: validation.errors });
    }

    const numericValue = Math.round(Number(targetValue));

    // Check duplicate slot if date or slot changed
    const duplicateSlotCheck = await query(
      'SELECT id FROM readings WHERE user_id = $1 AND date = $2 AND slot = $3 AND id != $4',
      [userId, targetDate, targetSlot, id]
    );

    if (duplicateSlotCheck.rows.length > 0) {
      return res.status(400).json({
        error: getDuplicateSlotMessage(targetSlot),
      });
    }

    // Check max 4 readings rule if date changed
    if (targetDate !== normalizeDate(currentReading.date)) {
      const dayCountResult = await query(
        'SELECT COUNT(*) AS count FROM readings WHERE user_id = $1 AND date = $2 AND id != $3',
        [userId, targetDate, id]
      );
      if (parseInt(dayCountResult.rows[0].count, 10) >= 4) {
        return res.status(400).json({
          error: 'You can add only 4 readings per day.',
        });
      }
    }

    // Update in database
    const updateResult = await query(
      `UPDATE readings
       SET date = $1, slot = $2, value = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, date, slot, value, created_at, updated_at`,
      [targetDate, targetSlot, numericValue, id, userId]
    );

    const updated = updateResult.rows[0];

    return res.json({
      message: 'Reading updated successfully.',
      reading: {
        ...updated,
        date: normalizeDate(updated.date),
        value: Number(updated.value),
      },
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({
        error: getDuplicateSlotMessage(req.body.slot),
      });
    }
    next(error);
  }
};

/**
 * Delete a reading
 * DELETE /api/readings/:id
 */
const deleteReading = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    return res.json({
      message: 'Reading deleted successfully.',
      id: Number(id),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReadings,
  getReadingById,
  createReading,
  updateReading,
  deleteReading,
  normalizeDate,
};
