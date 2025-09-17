import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import AppError from '../middlewares/errorHandler.js';

dotenv.config();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Hàm upload ảnh lên Cloudinary
export const uploadToCloudinary = async (fileBuffer, folder = 'avatars') => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [
            { width: 300, height: 300, crop: 'fill' }, // resize to 300x300
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(fileBuffer);
    });
    return result.secure_url;
  } catch (error) {
    // If error message contains "Invalid image file", set status code to 400
    const statusCode = error.message.includes("Invalid image file") ? 400 : 500;
    throw new AppError('Upload to Cloudinary failed: ' + error.message, statusCode);
  }
};
