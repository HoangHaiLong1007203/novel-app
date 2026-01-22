import "dotenv/config";
import mongoose from "mongoose";
import Genre from "../models/Genre.js";
import slugify from "../utils/slugify.js";
import { normalizeGenreName } from "../utils/normalizeGenreName.js";

const GENRES = [
  "Không CP",
  "Nam sinh",
  "Đa nguyên",
  "Bách hợp",
  "Nữ tôn",
  "Cổ đại",
  "Cận đại",
  "Hiện đại",
  "Tương lai",
  "sự nghiệp",
  "Tiên hiệp",
  "Mạt thế",
  "Sinh tồn",
  "Tranh bá",
  "Võ hiệp",
  "Quan trường",
  "Kinh thương",
  "Quân sự",
  "Xây dựng",
  "Làm ruộng",
  "Huyền học",
  "Phim ảnh",
  "Manga anime",
];

const main = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("Thiếu MONGO_URI trong backend/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const lastGenre = await Genre.findOne()
    .sort({ displayOrder: -1 })
    .select("displayOrder")
    .lean();

  let displayOrder = (lastGenre?.displayOrder ?? 0) + 1;
  let createdCount = 0;
  let skippedCount = 0;

  for (const rawName of GENRES) {
    const normalizedName = normalizeGenreName(rawName);
    if (!normalizedName) {
      console.log(`⏭️  Bỏ qua tên không hợp lệ: ${rawName}`);
      skippedCount += 1;
      continue;
    }

    const slug = slugify(normalizedName);
    if (!slug) {
      console.log(`⏭️  Bỏ qua tên không hợp lệ: ${rawName}`);
      skippedCount += 1;
      continue;
    }

    const exists = await Genre.findOne({ slug }).select("_id").lean();
    if (exists) {
      console.log(`⏭️  Đã tồn tại: ${normalizedName}`);
      skippedCount += 1;
      continue;
    }

    await Genre.create({
      name: normalizedName,
      slug,
      description: "",
      isActive: true,
      displayOrder,
      createdBy: null,
    });

    console.log(`✅ Đã thêm: ${normalizedName}`);
    createdCount += 1;
    displayOrder += 1;
  }

  console.log("\n🎉 Hoàn tất", { createdCount, skippedCount });
};

main()
  .catch((err) => {
    console.error("❌ Lỗi:", err.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });
