const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const migrate = require('../src/scripts/migrate');
const seed = require('../src/scripts/seed');

let doctorToken;
let patientToken;
let assignedPatientId;

beforeAll(async () => {
  await migrate();
  await seed();

  // Login as Doctor
  const docRes = await request(app).post('/api/auth/login').send({
    email: 'doctor@sweety.com',
    password: 'Doctor123!',
  });
  doctorToken = docRes.body.token;

  // Login as Demo Patient
  const patRes = await request(app).post('/api/auth/login').send({
    email: 'demo@sweety.com',
    password: 'Password123!',
  });
  patientToken = patRes.body.token;
  assignedPatientId = patRes.body.user.id;
});

afterAll(async () => {
  await pool.end();
});

describe('Doctor Role API (Bonus Feature)', () => {
  it('should deny non-doctor users access to doctor endpoints with 403', async () => {
    const res = await request(app)
      .get('/api/doctor/patients')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Doctor account required');
  });

  it('should allow authenticated doctor to list their assigned patients', async () => {
    const res = await request(app)
      .get('/api/doctor/patients')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.patients)).toBe(true);
    expect(res.body.patients.length).toBeGreaterThanOrEqual(1);

    const demoPatient = res.body.patients.find((p) => p.email === 'demo@sweety.com');
    expect(demoPatient).toBeDefined();
    expect(demoPatient.name).toBe('Demo Patient');
    expect(demoPatient.total_readings).toBeGreaterThan(0);
  });

  it('should allow doctor to view reports for an assigned patient', async () => {
    const res = await request(app)
      .get(`/api/doctor/patients/${assignedPatientId}/reports?date=2026-10-15`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.patient.email).toBe('demo@sweety.com');
    expect(res.body.daily.count).toBe(3);
    expect(res.body.daily.highest).toBe(172);
    expect(res.body.monthToDate.count).toBe(38);
    expect(res.body.monthly.count).toBe(75);
  });

  it('should reject request for non-assigned patient with 404', async () => {
    const nonExistentId = 999999;
    const res = await request(app)
      .get(`/api/doctor/patients/${nonExistentId}/reports?date=2026-10-15`)
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(404);
  });
});
