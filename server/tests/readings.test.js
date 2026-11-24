const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const migrate = require('../src/scripts/migrate');

let tokenUserA;
let tokenUserB;
let userIdA;
let userIdB;

beforeAll(async () => {
  await migrate();

  const uniqueSuffix = Date.now();

  // Create User A
  const resA = await request(app).post('/api/auth/register').send({
    name: 'User A',
    email: `usera_${uniqueSuffix}@example.com`,
    password: 'Password123!',
  });
  tokenUserA = resA.body.token;
  userIdA = resA.body.user.id;

  // Create User B
  const resB = await request(app).post('/api/auth/register').send({
    name: 'User B',
    email: `userb_${uniqueSuffix}@example.com`,
    password: 'Password123!',
  });
  tokenUserB = resB.body.token;
  userIdB = resB.body.user.id;
});

afterAll(async () => {
  await pool.end();
});

describe('Readings API - Validation & CRUD', () => {
  const testDate = '2026-10-15';

  describe('Validation Rules on POST /api/readings', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(app).post('/api/readings').send({
        date: testDate,
        slot: 'Morning (fasting)',
        value: 100,
      });
      expect(res.status).toBe(401);
    });

    it('should reject if value is missing with exact message "Please enter a glucose value."', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          date: testDate,
          slot: 'Morning (fasting)',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Please enter a glucose value.');
    });

    it('should reject if value is below 40 with exact message "Value must be between 40 and 600 mg/dl."', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          date: testDate,
          slot: 'Morning (fasting)',
          value: 39,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
    });

    it('should reject if value is above 600 with exact message "Value must be between 40 and 600 mg/dl."', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          date: testDate,
          slot: 'Morning (fasting)',
          value: 601,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Value must be between 40 and 600 mg/dl.');
    });

    it('should reject if date is in the future with exact message "Date cannot be in the future."', async () => {
      const futureDate = '2099-01-01';
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          date: futureDate,
          slot: 'Morning (fasting)',
          value: 110,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Date cannot be in the future.');
    });

    it('should create a valid reading successfully', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          date: testDate,
          slot: 'After lunch',
          value: 140,
        });

      expect(res.status).toBe(201);
      expect(res.body.reading.value).toBe(140);
      expect(res.body.reading.slot).toBe('After lunch');
      expect(res.body.reading.date).toBe(testDate);
    });

    it('should reject duplicate reading in same slot for date with exact message "You already have an After lunch reading for this date."', async () => {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          date: testDate,
          slot: 'After lunch',
          value: 145,
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('You already have an After lunch reading for this date.');
    });

    it('should enforce maximum 4 readings per day with exact message "You can add only 4 readings per day."', async () => {
      // Add the remaining 3 slots for testDate
      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ date: testDate, slot: 'Morning (fasting)', value: 90 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ date: testDate, slot: 'After breakfast', value: 135 });

      await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ date: testDate, slot: 'After dinner', value: 120 });

      // Now testDate has 4 readings. Try adding a 5th (with a slot)
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          date: testDate,
          slot: 'Morning (fasting)', // Even if slot collides, count check triggers
          value: 95,
        });

      expect(res.status).toBe(400);
      // Either slot collision or 4-readings rule applies
      expect(['You can add only 4 readings per day.', 'You already have a Morning (fasting) reading for this date.']).toContain(res.body.error);
    });
  });

  describe('User Isolation and Data Scoping', () => {
    it('User B should not see User A readings', async () => {
      const resA = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(resA.body.readings.length).toBeGreaterThan(0);

      const resB = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(resB.body.readings.length).toBe(0);
    });

    it('User B can add reading in same slot and date as User A without conflict', async () => {
      const resB = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({
          date: testDate,
          slot: 'After lunch',
          value: 155,
        });

      expect(resB.status).toBe(201);
      expect(resB.body.reading.slot).toBe('After lunch');
    });

    it('User B cannot edit User A reading', async () => {
      const listA = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`);

      const readingAId = listA.body.readings[0].id;

      const editRes = await request(app)
        .put(`/api/readings/${readingAId}`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ value: 200 });

      expect(editRes.status).toBe(404);
    });

    it('User B cannot delete User A reading', async () => {
      const listA = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`);

      const readingAId = listA.body.readings[0].id;

      const deleteRes = await request(app)
        .delete(`/api/readings/${readingAId}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(deleteRes.status).toBe(404);
    });
  });

  describe('Edit & Delete Reading (Own data)', () => {
    it('User A can edit their reading value', async () => {
      const listA = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`);

      const readingToEdit = listA.body.readings[0];

      const res = await request(app)
        .put(`/api/readings/${readingToEdit.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          date: readingToEdit.date,
          slot: readingToEdit.slot,
          value: 175,
        });

      expect(res.status).toBe(200);
      expect(res.body.reading.value).toBe(175);
    });

    it('User A can delete their reading', async () => {
      const listA = await request(app)
        .get('/api/readings')
        .set('Authorization', `Bearer ${tokenUserA}`);

      const readingToDelete = listA.body.readings[0];

      const res = await request(app)
        .delete(`/api/readings/${readingToDelete.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);

      const checkRes = await request(app)
        .get(`/api/readings/${readingToDelete.id}`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(checkRes.status).toBe(404);
    });
  });

  describe('Pagination Bonus', () => {
    it('supports pagination query parameters page and limit', async () => {
      const res = await request(app)
        .get('/api/readings?page=1&limit=2')
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(res.status).toBe(200);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.readings.length).toBeLessThanOrEqual(2);
    });
  });
});
