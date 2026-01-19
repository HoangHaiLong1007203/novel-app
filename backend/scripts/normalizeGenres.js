import dotenv from "dotenv";
import { connectDB } from "../config/db.js";
import Genre from "../models/Genre.js";
import Novel from "../models/Novel.js";
import slugify from "../utils/slugify.js";
import { normalizeGenreName } from "../utils/normalizeGenreName.js";

dotenv.config();

const arraysEqual = (a, b) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
};

const run = async () => {
  try {
    await connectDB();
    console.log("Starting genre normalization...");

    const genres = await Genre.find().sort({ createdAt: 1, _id: 1 });

    const canonicalNameByNormalized = new Map();
    const canonicalNames = [];
    const duplicateGenres = [];

    let updatedGenres = 0;

    for (const genre of genres) {
      const normalizedName = normalizeGenreName(genre.name);
      const nextSlug = slugify(normalizedName);

      if (!normalizedName || !nextSlug) {
        console.log(`- Skip invalid genre ${genre._id}: ${genre.name}`);
        continue;
      }

      if (canonicalNameByNormalized.has(normalizedName)) {
        duplicateGenres.push(genre);
        console.log(`- Duplicate genre will be removed: ${genre._id} (${genre.name}) -> ${normalizedName}`);
        continue;
      }

      const shouldUpdate = genre.name !== normalizedName || genre.slug !== nextSlug;
      if (shouldUpdate) {
        genre.name = normalizedName;
        genre.slug = nextSlug;
        await genre.save();
        updatedGenres += 1;
        console.log(`- Updated genre ${genre._id}: ${normalizedName}`);
      }

      canonicalNameByNormalized.set(normalizedName, normalizedName);
      canonicalNames.push(normalizedName);
    }

    if (duplicateGenres.length > 0) {
      const duplicateIds = duplicateGenres.map((g) => g._id);
      await Genre.deleteMany({ _id: { $in: duplicateIds } });
      console.log(`Removed ${duplicateGenres.length} duplicate genre(s).`);
    }

    const novels = await Novel.find();
    let updatedNovels = 0;

    for (const novel of novels) {
      const originalGenres = Array.isArray(novel.genres) ? novel.genres : [];
      const nextGenres = [];
      const seen = new Set();

      for (const g of originalGenres) {
        const normalized = normalizeGenreName(g);
        const canonical = canonicalNameByNormalized.get(normalized);
        if (!canonical) continue;
        if (seen.has(canonical)) continue;
        seen.add(canonical);
        nextGenres.push(canonical);
      }

      if (nextGenres.length === 0 && canonicalNames.length > 0) {
        const randomIndex = Math.floor(Math.random() * canonicalNames.length);
        nextGenres.push(canonicalNames[randomIndex]);
      }

      if (!arraysEqual(originalGenres, nextGenres)) {
        novel.genres = nextGenres;
        await novel.save();
        updatedNovels += 1;
        console.log(`- Updated novel ${novel._id}: ${originalGenres.join(", ")} -> ${nextGenres.join(", ")}`);
      }
    }

    console.log(`Completed. Genres updated: ${updatedGenres}, novels updated: ${updatedNovels}.`);
    process.exit(0);
  } catch (err) {
    console.error("Normalization failed:", err);
    process.exit(1);
  }
};

run();
