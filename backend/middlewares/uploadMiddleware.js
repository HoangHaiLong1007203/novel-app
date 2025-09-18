import multer from "multer";
import AppError from "./errorHandler.js";

const upload = multer();

export const handleUpload = (req, res, next) => {
  upload.single("avatar")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(new AppError("File upload error: " + err.message, 400));
    } else if (err) {
      return next(err);
    }
    next();
  });
};

export const handleCoverUpload = (req, res, next) => {
  upload.single("cover")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(new AppError("File upload error: " + err.message, 400));
    } else if (err) {
      return next(err);
    }
    next();
  });
};
