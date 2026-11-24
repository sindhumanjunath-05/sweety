const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'sweety_jwt_super_secret_dev_key_2026';

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user still exists in database
    const userRes = await query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({
        error: 'User account not found or has been removed.',
      });
    }

    req.user = userRes.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      error: 'Invalid authentication token.',
    });
  }
};

module.exports = {
  authenticateToken,
  JWT_SECRET,
};
