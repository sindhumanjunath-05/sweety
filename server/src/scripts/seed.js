const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const migrate = require('./migrate');

const seed = async () => {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting database seed...');
    // Ensure tables exist
    await migrate();

    await client.query('BEGIN');

    // 1. Create Demo User
    const demoEmail = 'demo@sweety.com';
    const demoPassword = 'Password123!';
    const salt = await bcrypt.genSalt(10);
    const demoHash = await bcrypt.hash(demoPassword, salt);

    // Upsert demo user
    let userResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'patient')
       ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
       RETURNING id, name, email`,
      ['Demo Patient', demoEmail, demoHash]
    );
    const demoUser = userResult.rows[0];

    // 2. Create Second User for data isolation verification
    const otherEmail = 'other@sweety.com';
    const otherHash = await bcrypt.hash('OtherPass123!', salt);
    let otherResult = await client.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'patient')
       ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
       RETURNING id, name, email`,
      ['Other Patient', otherEmail, otherHash]
    );
    const otherUser = otherResult.rows[0];

    // Clear existing readings for clean seeding
    await client.query('DELETE FROM readings WHERE user_id IN ($1, $2)', [
      demoUser.id,
      otherUser.id,
    ]);

    // 3. Generate sample readings for Demo User
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const todayDate = now.getDate();

    const slots = [
      'Morning (fasting)',
      'After breakfast',
      'After lunch',
      'After dinner',
    ];

    const readingsToInsert = [];

    // A. Today's readings (up to 3 slots filled)
    const todayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
      todayDate
    ).padStart(2, '0')}`;
    readingsToInsert.push(
      { date: todayStr, slot: slots[0], value: 92 },
      { date: todayStr, slot: slots[1], value: 138 },
      { date: todayStr, slot: slots[2], value: 125 }
    );

    // B. Previous days of current month (for Month-To-Date report)
    for (let day = 1; day < todayDate; day++) {
      // Pick 2 to 4 readings per day
      const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;
      readingsToInsert.push(
        { date: dayStr, slot: slots[0], value: 85 + ((day * 7) % 35) },
        { date: dayStr, slot: slots[1], value: 130 + ((day * 11) % 45) },
        { date: dayStr, slot: slots[2], value: 120 + ((day * 5) % 40) }
      );
      if (day % 2 === 0) {
        readingsToInsert.push({
          date: dayStr,
          slot: slots[3],
          value: 115 + ((day * 9) % 35),
        });
      }
    }

    // C. Whole previous month readings (for Monthly report)
    let prevYear = currentYear;
    let prevMonth = currentMonth; // previous month is currentMonth in 1-indexed, so currentMonth (0-indexed) = prev month number
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();

    for (let day = 1; day <= daysInPrevMonth; day++) {
      const dayStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;
      readingsToInsert.push(
        { date: dayStr, slot: slots[0], value: 88 + ((day * 3) % 30) },
        { date: dayStr, slot: slots[1], value: 132 + ((day * 6) % 50) }
      );
      if (day % 3 === 0) {
        readingsToInsert.push({
          date: dayStr,
          slot: slots[2],
          value: 128 + ((day * 4) % 42),
        });
      }
      if (day % 4 === 0) {
        readingsToInsert.push({
          date: dayStr,
          slot: slots[3],
          value: 118 + ((day * 8) % 38),
        });
      }
    }

    // Insert all demo readings
    for (const r of readingsToInsert) {
      await client.query(
        `INSERT INTO readings (user_id, date, slot, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, date, slot) DO NOTHING`,
        [demoUser.id, r.date, r.slot, r.value]
      );
    }

    // Insert isolated readings for second user
    await client.query(
      `INSERT INTO readings (user_id, date, slot, value)
       VALUES ($1, $2, $3, $4), ($1, $2, $5, $6)`,
      [otherUser.id, todayStr, slots[0], 199, slots[1], 215]
    );

    await client.query('COMMIT');

    console.log('✅ Seed completed successfully!');
    console.log('----------------------------------------------------');
    console.log('👤 Demo User:');
    console.log(`   Email:    ${demoEmail}`);
    console.log(`   Password: ${demoPassword}`);
    console.log(`   Readings: ${readingsToInsert.length} samples added`);
    console.log('----------------------------------------------------');
    console.log('👤 Other User (for isolation testing):');
    console.log(`   Email:    ${otherEmail}`);
    console.log(`   Password: OtherPass123!`);
    console.log('----------------------------------------------------');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
};

if (require.main === module) {
  seed();
}

module.exports = seed;
