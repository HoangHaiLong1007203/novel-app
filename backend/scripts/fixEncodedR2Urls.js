#!/usr/bin/env node
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Chapter from '../models/Chapter.js';

dotenv.config();

async function fix() {
  await connectDB();
  const chapters = await Chapter.find({
    $or: [
      { 'htmlFile.url': /%2F/ },
      { 'rawFile.url': /%2F/ },
    ],
  }).lean();

  console.log(`Found ${chapters.length} chapters to check`);

  for (const ch of chapters) {
    let updated = false;
    const update = {};

    const fixFile = (fileObj, fieldPrefix) => {
      if (!fileObj || !fileObj.url) return null;
      try {
        // find '/<bucket>/' in URL
        const m = fileObj.url.match(/^(https?:\/\/[^/]+)\/(.+?)\/(.+)$/);
        if (!m) return null;
        const base = m[1];
        const bucket = m[2];
        const encodedKey = m[3];
        if (!/%2F/i.test(encodedKey)) return null; // already ok
        const decodedKey = decodeURIComponent(encodedKey);
        // build new public url using encodeURI to preserve '/'
        const newUrl = `${base}/${bucket}/${encodeURI(decodedKey)}`;
        return { newUrl, decodedKey };
      } catch (err) {
        console.error('decode error for', fileObj.url, err.message);
        return null;
      }
    };

    const htmlFix = fixFile(ch.htmlFile, 'htmlFile');
    if (htmlFix) {
      updated = true;
      update['htmlFile.url'] = htmlFix.newUrl;
      update['htmlFile.key'] = htmlFix.decodedKey;
      console.log(`Will update html for chapter ${ch._id}: ${htmlFix.newUrl}`);
    }

    const rawFix = fixFile(ch.rawFile, 'rawFile');
    if (rawFix) {
      updated = true;
      update['rawFile.url'] = rawFix.newUrl;
      update['rawFile.key'] = rawFix.decodedKey;
      console.log(`Will update raw for chapter ${ch._id}: ${rawFix.newUrl}`);
    }

    if (updated) {
      await Chapter.updateOne({ _id: ch._id }, { $set: update });
      console.log(`Updated chapter ${ch._id}`);
    }
  }

  console.log('Done');
  await mongoose.disconnect();
  process.exit(0);
}

fix().catch((e) => {
  console.error(e);
  process.exit(1);
});
