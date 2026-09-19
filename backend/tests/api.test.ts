import express from 'express';
import request from 'supertest';
import authRoutes from '../src/routes/auth';
import accountRoutes from '../src/routes/accounts';
import dotenv from 'dotenv';

dotenv.config();

// Create an isolated Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

describe('Core API Endpoints', () => {
  
  it('GET /api/health should return 200 OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  // We are keeping testing minimal to prove the setup works as requested
  it('GET /api/auth/me without token should return 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/accounts without token should return 401', async () => {
    const res = await request(app).get('/api/accounts');
    expect(res.status).toBe(401);
  });
});
