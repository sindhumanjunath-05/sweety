const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { pool } = require('./config/db');
const migrate = require('./scripts/migrate');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Run migrations automatically on startup to ensure tables exist
    await migrate();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Sweety API server running on http://localhost:${PORT}`);
    });

    const gracefulShutdown = () => {
      console.log('\n🛑 Shutting down Sweety API server gracefully...');
      server.close(async () => {
        await pool.end();
        console.log('PostgreSQL pool closed. Server terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
