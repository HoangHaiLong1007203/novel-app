#!/usr/bin/env node
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Chapter from '../models/Chapter.js';

dotenv.config();

const id = process.argv[2];
if (!id) {
  console.error('Usage: node showChapterKeys.js <CHAPTER_ID>');
  process.exit(1);
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const ch = await Chapter.findById(id).lean();
  if (!ch) {
    console.error('Chapter not found');
    process.exit(1);
  }
  console.log('htmlFile.key:', ch.htmlFile?.key);
  console.log('htmlFile.url:', ch.htmlFile?.url);
  console.log('rawFile.key:', ch.rawFile?.key);
  console.log('rawFile.url:', ch.rawFile?.url);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
