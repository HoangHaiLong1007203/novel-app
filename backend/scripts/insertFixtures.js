import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Novel from '../models/Novel.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { normalizeText } from '../utils/normalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const insertFixtures = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find or create test user
    let user = await User.findOne({ username: 'testuser' });
    if (!user) {
      user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword'
      });
      await user.save();
    }

    // Load fixtures
    const fixturesPath = path.join(__dirname, '..', 'test', 'fixtures', 'novels-sample.json');
    const novelsData = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));

    // Insert novels
    for (const novelData of novelsData) {
      const existing = await Novel.findOne({ title: novelData.title });
      if (!existing) {
        const novel = new Novel({
          ...novelData,
          poster: user._id,
          titleNormalized: normalizeText(novelData.title),
          authorNormalized: normalizeText(novelData.author)
        });
        await novel.save();
        console.log(`Inserted: ${novel.title}`);
      } else {
        console.log(`Skipped (exists): ${novelData.title}`);
      }
    }

    console.log('Fixtures inserted successfully');
  } catch (error) {
    console.error('Error inserting fixtures:', error);
  } finally {
    await mongoose.disconnect();
  }
};

insertFixtures();