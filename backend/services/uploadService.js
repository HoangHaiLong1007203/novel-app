import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import AppError from "../middlewares/errorHandler.js";
import {
  uploadBuffer as uploadBufferToR2,
  getPresignedUrl as getPresignedR2Url,
} from "./r2UploadService.js";

dotenv.config();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Hàm upload ảnh lên Cloudinary
export const uploadToCloudinary = async (fileBuffer, folder = "avatars") => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: "image",
            transformation: [{ width: 300, height: 300, crop: "fill" }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(fileBuffer);
    });
    return result.secure_url;
  } catch (error) {
    // If error message contains "Invalid image file", set status code to 400
    const statusCode = error.message.includes("Invalid image file") ? 400 : 500;
    throw new AppError("Upload to Cloudinary failed: " + error.message, statusCode);
  }
};

const sanitizeSegment = (segment) => {
  return segment
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

export const uploadChapterFiles = async ({
  novelId,
  chapterNumber,
  rawBuffer,
  rawMimeType,
  rawExtension = "txt",
  htmlBuffer,
}) => {
  if (!rawBuffer || !htmlBuffer) {
    throw new AppError("Thiếu dữ liệu chương để upload", 400);
  }

  const baseSegment = sanitizeSegment(`${novelId}-${chapterNumber || "draft"}`);
  const uuid = uuidv4();
  const baseKey = `novels/${sanitizeSegment(novelId)}/chapters/${baseSegment}-${uuid}`;
  const rawKey = `${baseKey}/raw.${rawExtension}`;
  const htmlKey = `${baseKey}/rendered.html`;

  const [rawFile, htmlFile] = await Promise.all([
    uploadBufferToR2({ buffer: rawBuffer, key: rawKey, contentType: rawMimeType }),
    uploadBufferToR2({ buffer: htmlBuffer, key: htmlKey, contentType: "text/html" }),
  ]);

  return { rawFile, htmlFile };
};

export const generatePresignedChapterUrl = async (key, expiresIn = 900) => {
  if (!key) {
    throw new AppError("Không tìm thấy nội dung chương", 404);
  }
  return getPresignedR2Url(key, expiresIn);
};
