#!/usr/bin/env node
/**
 * Populate `authorUser` on Novel documents when `author` matches a User.username
 * Run: node scripts/populateAuthorUser.js
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import Novel from "../models/Novel.js";
import User from "../models/User.js";
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

  // Find all novels of type 'sáng tác' so we can force-update authorUser/author
  const cursor = Novel.find({ type: "sáng tác" }).cursor();
  let count = 0;
  let updated = 0;

  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    count++;
    const authorName = doc.author;
    if (!authorName) continue;

    // Prefer using the poster id for "sáng tác" novels to avoid username collisions.
    if (doc.type === "sáng tác" && doc.poster) {
      const posterUser = await User.findById(doc.poster);
      if (posterUser) {
        const updates = { authorUser: posterUser._id };
        // Ensure author string matches poster username for clarity
        if (doc.author !== posterUser.username) {
          updates.author = posterUser.username;
          updates.authorNormalized = normalizeText(posterUser.username);
        }
        await Novel.updateOne({ _id: doc._id }, { $set: updates });
        updated++;
        if (updated % 50 === 0) console.log(`Updated ${updated} novels so far...`);
        continue;
      }
    }

    // Fallback: try to find a user with this username (exact match)
    const user = await User.findOne({ username: authorName });
    if (user) {
      await Novel.updateOne({ _id: doc._id }, { $set: { authorUser: user._id } });
      updated++;
      if (updated % 50 === 0) console.log(`Updated ${updated} novels so far...`);
    }
  }

  console.log(`Scanned ${count} 'sáng tác' novels. Populated authorUser for ${updated} novels.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
