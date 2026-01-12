#!/usr/bin/env node
import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import Chapter from '../models/Chapter.js';
import { getPublicUrl } from '../services/r2UploadService.js';

dotenv.config();

async function fix() {
  await connectDB();

  // Build dynamic query: match files that reference the old bucket prefix
  const conditions = [
    { 'htmlFile.url': /\/novel-content\// },
    { 'rawFile.url': /\/novel-content\// },
    { 'htmlFile.key': /^novel-content\// },
    { 'rawFile.key': /^novel-content\// },
  ];

  // If R2_ENDPOINT is set, match any urls that include that host (old direct R2 URLs)
  if (process.env.R2_ENDPOINT) {
    try {
      const r2Host = new URL(process.env.R2_ENDPOINT).host.replace(/\./g, '\\.');
      const hostRegex = new RegExp(r2Host);
      conditions.push({ 'htmlFile.url': hostRegex }, { 'rawFile.url': hostRegex });
    } catch (err) {
      // ignore invalid R2_ENDPOINT
    }
  }

  const query = { $or: conditions };

  const chapters = await Chapter.find(query).lean();
  console.log(`Found ${chapters.length} chapters to check`);

  let updated = 0;
  for (const ch of chapters) {
    const set = {};

    // helper to derive and normalize key & url for a file field
    const fixFile = (fileFieldName) => {
      const file = ch[fileFieldName];
      if (!file) return null;

      // prefer stored key; otherwise try to derive from url
      let key = file.key || null;
      if (!key && file.url) {
        try {
          const u = new URL(file.url);
          let path = u.pathname.replace(/^\/+/, '');

          // If path starts with the bucket name, strip it
          if (process.env.R2_BUCKET && path.startsWith(`${process.env.R2_BUCKET}/`)) {
            key = path.substring((process.env.R2_BUCKET + '/').length);
          } else if (path.startsWith('novel-content/')) {
            key = path.substring('novel-content/'.length);
          } else {
            key = path; // fallback (may include prefix)
          }
        } catch (err) {
          return null;
        }
      }

      if (!key) return null;

      // strip any leading novel-content/ prefix from the key
      const newKey = key.replace(/^novel-content\//, '');

      // compute new public URL from normalized key
      const newPublicUrl = getPublicUrl(newKey);

      const changes = {};
      if (file.key !== newKey) changes[`${fileFieldName}.key`] = newKey;
      if (file.url !== newPublicUrl) changes[`${fileFieldName}.url`] = newPublicUrl;
      return Object.keys(changes).length ? changes : null;
    };

    const htmlChanges = fixFile('htmlFile');
    const rawChanges = fixFile('rawFile');

    if (htmlChanges) Object.assign(set, htmlChanges);
    if (rawChanges) Object.assign(set, rawChanges);

    if (Object.keys(set).length) {
      await Chapter.updateOne({ _id: ch._id }, { $set: set });
      updated++;
      console.log(`Updated chapter ${ch._id} -> keys/urls normalized`);
    }
  }

  console.log(`Done. Updated ${updated} chapters.`);
  process.exit(0);
}

fix().catch((err) => {
  console.error(err);
  process.exit(1);
});
