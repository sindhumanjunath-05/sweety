const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const migrate = require('../src/scripts/migrate');

beforeAll(async () => {
  await migrate();
});

afterAll(async () => {
  await pool.end();
});

describe('Authentication API', () => {
  const uniqueSuffix = Date.now();
  const testUser = {
    name: 'Alice Tester',
    email: `alice_${uniqueSuffix}@example.com`,
    password: 'Password123!',
  };

  describe('POST /api/auth/register', () => {
    it('should reject registration without a name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Name is required.');
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'not-an-email', password: testUser.password });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Please enter a valid email address.');
    });

    it('should reject registration with short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: testUser.email, password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Password must be at least 6 characters long.');
    });

    it('should register a new user successfully and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.user.name).toBe(testUser.name);
      expect(res.body.user.password_hash).toBeUndefined(); // Never expose hashed password
    });

    it('should reject registration with duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('An account with this email already exists.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password.');
    });

    it('should log in successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    });
  });

  describe('GET /api/auth/me', () => {
    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return user profile with valid Bearer token', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const token = loginRes.body.token;

      const profileRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.user.email).toBe(testUser.email.toLowerCase());
    });
  });
});
