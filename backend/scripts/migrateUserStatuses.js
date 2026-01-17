import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../config/db.js";
import User from "../models/User.js";

const VALID_STATUSES = ["active", "banned"];

async function run() {
  await connectDB();

  const missingFilter = { $or: [{ status: { $exists: false } }, { status: null }] };
  const invalidFilter = { status: { $nin: VALID_STATUSES } };

  const [missingResult, invalidResult] = await Promise.all([
    User.updateMany(missingFilter, { $set: { status: "active" } }),
    User.updateMany(invalidFilter, { $set: { status: "active" } }),
  ]);

  const [activeCount, bannedCount, total] = await Promise.all([
    User.countDocuments({ status: "active" }),
    User.countDocuments({ status: "banned" }),
    User.estimatedDocumentCount(),
  ]);

  console.log("User status migration summary:");
  console.log(` - Updated missing statuses: ${missingResult.modifiedCount}`);
  console.log(` - Normalized invalid statuses: ${invalidResult.modifiedCount}`);
  console.log(` - Totals => active: ${activeCount}, banned: ${bannedCount}, all users: ${total}`);

  process.exit(0);
}

run().catch((err) => {
  console.error("Failed to migrate user statuses:", err);
  process.exit(1);
});
