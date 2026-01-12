#!/usr/bin/env node
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Chapter from '../models/Chapter.js';

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const chapters = await Chapter.find({}).sort({ createdAt: -1 }).limit(10).select('title isLocked htmlFile rawFile createdAt');
  console.log(`Found ${chapters.length} chapters (most recent 10):\n`);
  chapters.forEach((ch) => {
    console.log('---');
    console.log('id:', ch._id.toString());
    console.log('title:', ch.title);
    console.log('isLocked:', ch.isLocked);
    console.log('createdAt:', ch.createdAt);
    console.log('htmlFile.key:', ch.htmlFile?.key);
    console.log('htmlFile.url:', ch.htmlFile?.url);
    console.log('rawFile.key:', ch.rawFile?.key);
    console.log('rawFile.url:', ch.rawFile?.url);
  });

  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
