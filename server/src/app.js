const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const readingsRoutes = require('./routes/readings.routes');
const reportsRoutes = require('./routes/reports.routes');
const doctorRoutes = require('./routes/doctor.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Sweety Blood Glucose Tracker API',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/doctor', doctorRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
