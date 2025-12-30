#!/usr/bin/env node
/**
 * Migration script: populate titleNormalized and authorNormalized for existing novels.
 * Run: node scripts/migrate-normalized.js (from backend/)
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import Novel from "../models/Novel.js";
import { normalizeText } from "../utils/normalize.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is required in env");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const cursor = Novel.find().cursor();
  let count = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const titleNormalized = normalizeText(doc.title || "");
    const authorNormalized = normalizeText(doc.author || "");
    await Novel.updateOne({ _id: doc._id }, { $set: { titleNormalized, authorNormalized } });
    count++;
    if (count % 100 === 0) console.log(`Updated ${count} docs...`);
  }

  console.log(`Migration complete. Updated ${count} documents.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
