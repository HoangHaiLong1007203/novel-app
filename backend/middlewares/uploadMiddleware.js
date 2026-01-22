import multer from "multer";
import AppError from "./errorHandler.js";

// memory storage so we can convert/upload buffers directly
const storage = multer.memoryStorage();

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const allowedMime = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc
  "text/plain", // .txt
  "text/markdown", // .md
  "text/html", // .html
  // allow general binary in case some docx variants present
  "application/octet-stream",
];

// Images (avatar, cover) should accept common image types
// Add jfif support because some clients produce .jfif files
const allowedImageMime = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/jfif",
];
const allowedImageExt = ["png", "jpg", "jpeg", "webp", "gif", "svg", "jfif"];

const fileFilter = (req, file, cb) => {
  const mimetype = file.mimetype;
  const original = file.originalname || "";
  const ext = original.split(".").pop()?.toLowerCase();

  // If uploading an image field (avatar or cover), allow common image types
  if (file.fieldname === "avatar" || file.fieldname === "cover") {
    const okExt = ext ? allowedImageExt.includes(ext) : false;
    if (okExt && allowedImageMime.includes(mimetype)) {
      cb(null, true);
    } else if (okExt && !mimetype) {
      cb(null, true);
    } else {
      cb(new AppError("Unsupported image file type", 400));
    }
    return;
  }

  const okExt = ["docx", "doc", "txt", "md", "html"].includes(ext);
  if (okExt && (allowedMime.includes(mimetype) || (mimetype && mimetype.startsWith("application/")))) {
    cb(null, true);
  } else if (okExt && !mimetype) {
    // allow when mimetype missing but extension ok
    cb(null, true);
  } else {
    cb(new AppError("Unsupported file type", 400));
  }
};

const upload = multer({ storage, limits: { fileSize: DEFAULT_MAX_SIZE }, fileFilter });

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

// New middleware for chapter/document uploads (field name: file)
export const handleDocUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(new AppError("Document upload error: " + err.message, 400));
    } else if (err) {
      return next(err);
    }
    // multer stored buffer at req.file.buffer
    next();
  });
};
