import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import Novel from '../models/Novel.js';
import User from '../models/User.js';
import novelRoutes from '../routes/novel.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import errorHandler from '../middlewares/errorHandler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Mock authMiddleware for search (public endpoint)
app.use('/api/novels/search', (req, res, next) => {
  // Mock user for search
  req.user = { userId: 'mock-user-id' };
  next();
});
app.use('/api/novels', novelRoutes);
app.use(errorHandler);

describe('Search Novels', () => {
  let user;
  let token;

  beforeAll(async () => {
    // Create a test user
    user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword'
    });
    await user.save();

    // Mock JWT token (simple for testing)
    token = 'mock-jwt-token';
  });

  beforeEach(async () => {
    // Load sample data
    const fixturesPath = path.join(__dirname, 'fixtures', 'novels-sample.json');
    const novelsData = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));

    for (const novelData of novelsData) {
      const novel = new Novel({
        ...novelData,
        poster: user._id,
        titleNormalized: novelData.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
        authorNormalized: novelData.author.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      });
      await novel.save();
    }
  });

  it('should search novels by title (exact match)', async () => {
    const response = await request(app)
      .get('/api/novels/search?q=Đắc Nhân Tâm')
      .expect(200);

    expect(response.body.novels).toHaveLength(1);
    expect(response.body.novels[0].title).toBe('Đắc Nhân Tâm');
    expect(response.body.novels[0].score).toBeGreaterThan(0);
  });

  it('should search novels by title (partial match)', async () => {
    const response = await request(app)
      .get('/api/novels/search?q=Đắc')
      .expect(200);

    expect(response.body.novels.length).toBeGreaterThan(0);
    expect(response.body.novels[0].title).toContain('Đắc');
  });

  it('should search novels by author', async () => {
    const response = await request(app)
      .get('/api/novels/search?q=Nguyễn Du')
      .expect(200);

    expect(response.body.novels).toHaveLength(1);
    expect(response.body.novels[0].author).toBe('Nguyễn Du');
  });

  it('should handle Vietnamese diacritics (normalized search)', async () => {
    const response = await request(app)
      .get('/api/novels/search?q=Dac Nhan Tam') // without diacritics
      .expect(200);

    expect(response.body.novels.length).toBeGreaterThan(0);
    expect(response.body.novels[0].title).toBe('Đắc Nhân Tâm');
    expect(response.body.novels[0].score).toBe(3); // normalized match
  });

  it('should return pagination', async () => {
    const response = await request(app)
      .get('/api/novels/search?q=truyện&page=1&limit=2')
      .expect(200);

    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.page).toBe(1);
    expect(response.body.pagination.limit).toBe(2);
    expect(response.body.novels).toHaveLength(2); // 4 total, page 1 limit 2
    expect(response.body.pagination.total).toBeGreaterThanOrEqual(4);
  });

  it('should return empty results for no matches', async () => {
    const response = await request(app)
      .get('/api/novels/search?q=nonexistent')
      .expect(200);

    expect(response.body.novels).toHaveLength(0);
    expect(response.body.pagination.total).toBe(0);
  });

  it('should score exact title higher', async () => {
    const response = await request(app)
      .get('/api/novels/search?q=Tắt Đèn')
      .expect(200);

    expect(response.body.novels[0].title).toBe('Tắt Đèn');
    expect(response.body.novels[0].score).toBe(133); // 100 exact + 30 contains + 3 normalized
  });
});