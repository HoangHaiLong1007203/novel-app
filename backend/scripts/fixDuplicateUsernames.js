#!/usr/bin/env node
/**
 * Fix duplicate usernames by appending a numeric suffix to duplicates,
 * then run `populateAuthorUser.js` to refresh `authorUser` on novels.
 * Run: node scripts/fixDuplicateUsernames.js
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import { spawnSync } from "child_process";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is required in env");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // Find usernames with duplicates (exact match)
  const duplicates = await User.aggregate([
    { $group: { _id: "$username", count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  if (duplicates.length === 0) {
    console.log("No duplicate usernames found.");
  } else {
    console.log(`Found ${duplicates.length} duplicated username(s).`);
  }

  let totalRenamed = 0;

  for (const group of duplicates) {
    const base = group._id;
    console.log(`Processing duplicates for username: ${base} (count=${group.count})`);

    // Fetch all users with this username, order by createdAt if available so we keep the oldest
    const users = await User.find({ username: base }).sort({ createdAt: 1 }).exec();
    if (users.length <= 1) continue;

    // Keep the first as canonical, rename the rest
    for (let i = 1; i < users.length; i++) {
      const user = users[i];
      // find a free new username by appending a number
      let suffix = 1;
      let newUsername;
      do {
        newUsername = `${base}${suffix}`;
        // ensure it doesn't equal the old base (shouldn't) and not exist
        // use exact match
        // eslint-disable-next-line no-await-in-loop
        var exists = await User.exists({ username: newUsername });
        suffix++;
      } while (exists);

      // Update user
      await User.updateOne({ _id: user._id }, { $set: { username: newUsername } });
      totalRenamed++;
      console.log(`- Renamed user ${user._id} -> ${newUsername}`);
    }
  }

  console.log(`Renamed ${totalRenamed} user(s).`);

  if (totalRenamed > 0) {
    // Run populateAuthorUser to refresh novels
    console.log("Running populateAuthorUser.js to refresh novels...");
    const res = spawnSync(process.execPath, ["scripts/populateAuthorUser.js"], { stdio: "inherit", cwd: process.cwd() });
    if (res.error) {
      console.error("Failed to run populateAuthorUser.js:", res.error);
      await mongoose.disconnect();
      process.exit(1);
    }
  } else {
    console.log("No usernames were renamed; skipping populateAuthorUser.js.");
  }

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
