#!/usr/bin/env node
import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Chapter from "../models/Chapter.js";
import { uploadChapterFiles } from "../services/uploadService.js";
import { convertDocBufferToHtml } from "../utils/convertDocToHtml.js";

const args = process.argv.slice(2);
const batchArg = args.find((arg) => arg.startsWith("--batch="));
const batchSize = batchArg ? parseInt(batchArg.split("=")[1], 10) : 50;
const dryRun = args.includes("--dry-run");
const keepContent = args.includes("--keep-content");

const filter = {
  $or: [{ htmlFile: { $exists: false } }, { "htmlFile.url": { $in: [null, ""] } }],
  content: { $exists: true, $ne: null, $ne: "" },
};

const migrateChapter = async (chapter) => {
  const rawBuffer = Buffer.from(chapter.content, "utf8");
  const { html } = await convertDocBufferToHtml(
    rawBuffer,
    `${chapter.title || "chapter"}.txt`,
    "text/plain"
  );
  const htmlBuffer = Buffer.from(html, "utf8");

  if (dryRun) {
    console.log(`[dry-run] Would migrate chapter ${chapter._id} (${chapter.title})`);
    return;
  }

  const uploads = await uploadChapterFiles({
    novelId: chapter.novel,
    chapterNumber: chapter.chapterNumber,
    rawBuffer,
    rawMimeType: "text/plain",
    rawExtension: "txt",
    htmlBuffer,
  });

  chapter.rawFile = uploads.rawFile;
  chapter.htmlFile = uploads.htmlFile;
  if (!keepContent) {
    chapter.set("content", undefined);
  }
  await chapter.save();
};

const run = async () => {
  await connectDB();
  let totalMigrated = 0;
  let batchIndex = 0;

  while (true) {
    const chapters = await Chapter.find(filter).limit(batchSize);
    if (!chapters.length) {
      break;
    }

    batchIndex += 1;
    console.log(`Processing batch #${batchIndex} (${chapters.length} chapters)`);
    for (const chapter of chapters) {
      await migrateChapter(chapter);
      if (!dryRun) {
        totalMigrated += 1;
      }
    }

    if (dryRun) {
      console.log("Dry run completed. Exiting after first batch.");
      break;
    }
  }

  console.log(`Migration finished. Migrated ${totalMigrated} chapters.`);
  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (err) => {
  console.error("Migration failed", err);
  await mongoose.connection.close();
  process.exit(1);
});
