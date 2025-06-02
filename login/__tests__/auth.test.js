const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Asegúrate de exportar app en server.js
const User = require('../models/users');

// __tests__/auth.test.js

const TEST_DB = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/sistemalogin_test';

beforeAll(async () => {
  await mongoose.connect(TEST_DB, { useNewUrlParser: true, useUnifiedTopology: true });
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth Endpoints', () => {
  let testUser = {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'testpass123',
    securityQuestion: 'color_favorito',
    securityAnswer: 'azul'
  };

  let token = '';
  let resetToken = '';

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/register')
      .send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should not register a user with existing email', async () => {
    const res = await request(app)
      .post('/register')
      .send(testUser);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: testUser.email, password: testUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('should not login with wrong password', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: testUser.email, password: 'wrongpass' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should verify email for password recovery', async () => {
    const res = await request(app)
      .post('/recovery_password-rp')
      .send({ email: testUser.email });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should not verify non-existent email for recovery', async () => {
    const res = await request(app)
      .post('/recovery_password-rp')
      .send({ email: 'noexiste@example.com' });
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should verify security question and answer', async () => {
    const res = await request(app)
      .post('/com_password-cp')
      .send({
        username: testUser.username,
        email: testUser.email,
        securityQuestion: testUser.securityQuestion,
        securityAnswer: testUser.securityAnswer
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.resetToken).toBeDefined();
    resetToken = res.body.resetToken;
  });

  it('should not verify with wrong security answer', async () => {
    const res = await request(app)
      .post('/com_password-cp')
      .send({
        username: testUser.username,
        email: testUser.email,
        securityQuestion: testUser.securityQuestion,
        securityAnswer: 'incorrecta'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should change password with valid reset token', async () => {
    const res = await request(app)
      .post('/change-password-final')
      .set('Authorization', `Bearer ${resetToken}`)
      .send({
        newPassword: 'newpass123',
        confirmPassword: 'newpass123'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should not change password with invalid token', async () => {
    const res = await request(app)
      .post('/change-password-final')
      .set('Authorization', `Bearer invalidtoken`)
      .send({
        newPassword: 'newpass123',
        confirmPassword: 'newpass123'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
