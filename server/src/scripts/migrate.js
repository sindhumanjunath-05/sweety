const { pool } = require('../config/db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database migrations...');
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'patient',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Create readings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS readings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        slot VARCHAR(50) NOT NULL,
        value INTEGER NOT NULL CHECK (value >= 40 AND value <= 600),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT unique_user_date_slot UNIQUE (user_id, date, slot)
      );
    `);

    // Create doctor_patients assignment table (Bonus: Doctor role)
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctor_patients (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT unique_doctor_patient UNIQUE (doctor_id, patient_id)
      );
    `);

    // Create indexes for fast lookup and reporting
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_readings_user_slot ON readings(user_id, slot);
    `);

    await client.query('COMMIT');
    console.log('✅ Migrations completed successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
};

if (require.main === module) {
  migrate();
}

module.exports = migrate;
