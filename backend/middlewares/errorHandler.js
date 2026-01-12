// middlewares/errorHandler.js

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;
    this.isOperational = true; // đánh dấu lỗi do dev/validation, không phải lỗi system
  }
}

function errorHandler(err, req, res, next) {
  // Log toàn bộ lỗi cho dev/debug — vẫn giữ ở server
  console.error(err);

  const isProd = process.env.NODE_ENV === 'production';
  // chuẩn hoá response body: luôn có `success` và `message`, thêm `details` khi không phải production
  const makeBody = (message) => {
    const body = { success: false, message: message || 'Internal Server Error' };
    if (!isProd && err && err.stack) body.details = err.stack;
    return body;
  };

  // Nếu là lỗi do người dùng (throw AppError)
  if (err.statusCode) {
    return res.status(err.statusCode).json(makeBody(err.message));
  }

  // Nếu là lỗi từ validation (ví dụ joi, express-validator)
  if (err.name === 'ValidationError') {
    return res.status(400).json(makeBody(err.message));
  }

  // Nếu là lỗi xác thực (auth)
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    // Nếu thư viện cung cấp message, dùng nó; nếu không, mặc định 'Unauthorized'
    return res.status(401).json(makeBody(err.message || 'Unauthorized'));
  }

  // Nếu là lỗi database (MongoDB)
  if (err.name === 'CastError' || err.name === 'MongoError') {
    return res.status(400).json(makeBody(err.message || 'Invalid data or database error'));
  }

  // Lỗi không xác định khác (server error)
  res.status(500).json(makeBody('Internal Server Error'));
}

export default AppError;
export { errorHandler };
