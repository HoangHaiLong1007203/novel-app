import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Novel from "../models/Novel.js";
import User from "../models/User.js";
import { normalizeText } from "../utils/normalize.js";

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    console.log('Starting author normalization...');

    // Find novels where author looks like an ObjectId string (24 hex chars)
    // or where author is stored as an ObjectId type in the document.
    const pattern = /^[a-fA-F0-9]{24}$/;
    const novels = await Novel.find({
      $or: [
        { author: { $regex: pattern } },
        { author: { $type: 'objectId' } }
      ]
    });

    console.log(`Found ${novels.length} novel(s) with author as ObjectId-like value or ObjectId type`);

    let updated = 0;
    for (const n of novels) {
      const posterId = n.poster;
      if (!posterId) {
        console.log(`- Novel ${n._id} has no poster, skipping`);
        continue;
      }
      const user = await User.findById(posterId);
      if (!user) {
        console.log(`- Novel ${n._id} poster ${posterId} not found, skipping`);
        continue;
      }
      const username = user.username;
      if (!username) {
        console.log(`- Poster ${posterId} has no username, skipping`);
        continue;
      }
      // Update novel
      n.author = username;
      n.authorNormalized = normalizeText(username);
      await n.save();
      console.log(`- Updated novel ${n._id}: author -> ${username}`);
      updated++;
    }

    console.log(`Completed. ${updated} novel(s) updated.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

run();
