const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const migrate = require('../src/scripts/migrate');

let token;
let userId;

beforeAll(async () => {
  await migrate();

  const unique = Date.now();
  const res = await request(app).post('/api/auth/register').send({
    name: 'Report Tester',
    email: `reports_${unique}@example.com`,
    password: 'Password123!',
  });
  token = res.body.token;
  userId = res.body.user.id;

  // Let's seed specific deterministic readings for a test date: 2026-10-15
  // Day 1: 2026-10-15 (Daily report date)
  // Values: 90, 130, 145, 115
  // Highest: 145, Lowest: 90, Average: (90 + 130 + 145 + 115) / 4 = 480 / 4 = 120.0
  await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: '2026-10-15', slot: 'Morning (fasting)', value: 90 });

  await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: '2026-10-15', slot: 'After breakfast', value: 130 });

  await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: '2026-10-15', slot: 'After lunch', value: 145 });

  await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: '2026-10-15', slot: 'After dinner', value: 115 });

  // Day 2: 2026-10-05 (Month-to-date will include this, but Daily 2026-10-15 will not)
  await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: '2026-10-05', slot: 'Morning (fasting)', value: 85 });

  // Previous month: 2026-09-20 (Monthly report will include this)
  await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: '2026-09-20', slot: 'Morning (fasting)', value: 95 });

  await request(app)
    .post('/api/readings')
    .set('Authorization', `Bearer ${token}`)
    .send({ date: '2026-09-20', slot: 'After lunch', value: 160 });
});

afterAll(async () => {
  await pool.end();
});

describe('Reports API', () => {
  it('should return correct calculations for Daily Report (15 Oct 2026)', async () => {
    const res = await request(app)
      .get('/api/reports?date=2026-10-15')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const daily = res.body.daily;
    expect(daily.startDate).toBe('2026-10-15');
    expect(daily.endDate).toBe('2026-10-15');
    expect(daily.count).toBe(4);
    expect(daily.highest).toBe(145);
    expect(daily.lowest).toBe(90);
    expect(daily.average).toBe(120.0);
    expect(daily.readings.length).toBe(4);

    // Verify slot listing is present
    const slots = daily.readings.map((r) => r.slot);
    expect(slots).toContain('Morning (fasting)');
    expect(slots).toContain('After breakfast');
    expect(slots).toContain('After lunch');
    expect(slots).toContain('After dinner');
  });

  it('should return correct calculations for Month-to-date Report (1 Oct - 15 Oct 2026)', async () => {
    const res = await request(app)
      .get('/api/reports?date=2026-10-15')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const mtd = res.body.monthToDate;
    expect(mtd.startDate).toBe('2026-10-01');
    expect(mtd.endDate).toBe('2026-10-15');
    expect(mtd.count).toBe(5); // 4 from 15th + 1 from 5th
    expect(mtd.highest).toBe(145);
    expect(mtd.lowest).toBe(85);
    // (90 + 130 + 145 + 115 + 85) / 5 = 565 / 5 = 113.0
    expect(mtd.average).toBe(113.0);
  });

  it('should return correct calculations for Monthly Report (Whole previous month 1 Sep - 30 Sep 2026)', async () => {
    const res = await request(app)
      .get('/api/reports?date=2026-10-15')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    const monthly = res.body.monthly;
    expect(monthly.startDate).toBe('2026-09-01');
    expect(monthly.endDate).toBe('2026-09-30');
    expect(monthly.count).toBe(2);
    expect(monthly.highest).toBe(160);
    expect(monthly.lowest).toBe(95);
    // (95 + 160) / 2 = 255 / 2 = 127.5
    expect(monthly.average).toBe(127.5);
  });

  it('should return friendly empty state when no readings exist for the date', async () => {
    const emptyDate = '2025-05-10';
    const res = await request(app)
      .get(`/api/reports?date=${emptyDate}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const daily = res.body.daily;
    expect(daily.count).toBe(0);
    expect(daily.highest).toBeNull();
    expect(daily.lowest).toBeNull();
    expect(daily.average).toBeNull();
    expect(daily.readings).toEqual([]);
  });
});
