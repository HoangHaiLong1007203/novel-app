import jwt from "jsonwebtoken";
import AppError from "./errorHandler.js";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Không có token", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded; // chứa userId
    next();
  } catch (err) {
    return next(new AppError("Token không hợp lệ hoặc đã hết hạn", 401));
  }
};
export default authMiddleware;