import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ES module safe __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Resolve .env: prefer backend/.env, fallback to repo root .env
let loadedEnvPath = null;
if (!process.env.MONGO_URI) {
  const tryPaths = [path.resolve(__dirname, "../.env"), path.resolve(__dirname, "../../.env")];
  for (const p of tryPaths) {
    const result = dotenv.config({ path: p });
    if (result.parsed) {
      loadedEnvPath = p;
      break;
    }
  }
} else {
  loadedEnvPath = "(env provided via process)";
}
if (!process.env.MONGO_URI) {
  console.warn("MONGO_URI not set after loading .env. Checked:", loadedEnvPath);
}

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error("MONGO_URI not set in environment (.env)");
  process.exit(1);
}

async function run() {
  await mongoose.connect(uri, {});

  const coll = mongoose.connection.collection("reviews");
  console.log("Indexes before:");
  console.log(await coll.indexes());

  // Attempt to drop the legacy index if it exists.
  const indexNames = ["novel_1_user_1", "novel_1_user_1_parentReview_1"];
  for (const name of indexNames) {
    try {
      const existing = (await coll.indexes()).find(i => i.name === name);
      if (existing) {
        console.log(`Dropping index: ${name}`);
        await coll.dropIndex(name);
      }
    } catch (err) {
      console.warn(`Failed to drop index ${name}:`, err.message);
    }
  }

  // Create the desired partial unique index for top-level reviews
  try {
    console.log("Creating partial unique index on { novel:1, user:1 } where parentReview=null");
    await coll.createIndex({ novel: 1, user: 1 }, { unique: true, partialFilterExpression: { parentReview: null } });
  } catch (err) {
    console.error("Failed to create partial index:", err.message);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log("Indexes after:");
  console.log(await coll.indexes());

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
