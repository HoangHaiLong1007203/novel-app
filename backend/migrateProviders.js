import dotenv from "dotenv";
dotenv.config(); // load .env

import { connectDB } from "./config/db.js";
import User from "./models/User.js";

connectDB();

async function migrate() {
  const users = await User.find({});
  for (let u of users) {
    let updated = false;

    if (!u.providers || u.providers.length === 0) {
      u.providers = [];
      updated = true;
    }

    if (u.provider === "local" && !u.providers.some(p => p.name === "local")) {
      u.providers.push({ name: "local" });
      updated = true;
    }

    if (u.provider === "google" && u.providerId && !u.providers.some(p => p.name === "google")) {
      u.providers.push({ name: "google", providerId: u.providerId });
      updated = true;
    }

    if (u.provider === "facebook" && u.providerId && !u.providers.some(p => p.name === "facebook")) {
      u.providers.push({ name: "facebook", providerId: u.providerId });
      updated = true;
    }

    if (updated) {
      u.provider = undefined;
      u.providerId = undefined;
      await u.save();
      console.log(`Migrated user: ${u._id}`);
    }
  }

  console.log("✅ Migration done");
  process.exit();
}

migrate();
