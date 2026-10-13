import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await User.init();
}, 60_000);

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});

describe('POST /api/auth/register', () => {
  it('creates a normalized citizen account and returns a token', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: '  Jane Citizen  ',
      email: '  JANE@example.com  ',
      password: 'StrongPass123!',
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      name: 'Jane Citizen',
      email: 'jane@example.com',
      role: 'citizen',
    });
    expect(await User.countDocuments()).toBe(1);
  });

  it('does not allow public registration to assign a privileged role', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'New User',
      email: 'new@example.com',
      password: 'StrongPass123!',
      role: 'admin',
    });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('citizen');
  });

  it('returns a clear validation error for a short password', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'New User',
      email: 'new@example.com',
      password: 'short',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/8 characters/);
  });

  it('returns a clear conflict for an email that already exists, ignoring case', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'First User',
      email: 'same@example.com',
      password: 'StrongPass123!',
    });

    const response = await request(app).post('/api/auth/register').send({
      name: 'Second User',
      email: 'SAME@example.com',
      password: 'StrongPass123!',
    });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already exists/);
    expect(await User.countDocuments()).toBe(1);
  });
});
