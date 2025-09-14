// middlewares/errorHandler.js

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;
    this.isOperational = true; // đánh dấu lỗi do dev/validation, không phải lỗi system
    Error.captureStackTrace(this, this.constructor);
  }
}

function errorHandler(err, req, res, next) {
  console.error(err); // log toàn bộ stack trace để dev debug

  // Nếu là lỗi do người dùng (throw AppError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Nếu là lỗi từ validation (ví dụ joi, express-validator)
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  // Nếu là lỗi xác thực (auth)
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  // Lỗi không xác định khác (server error)
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
  });
}

export { AppError, errorHandler };
