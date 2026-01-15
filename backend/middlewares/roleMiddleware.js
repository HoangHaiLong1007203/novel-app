import User from "../models/User.js";
import AppError from "./errorHandler.js";

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user?.userId) {
      return next(new AppError("Không có token", 401));
    }
    const user = await User.findById(req.user.userId).select("role");
    if (!user || user.role !== "admin") {
      return next(new AppError("Bạn không có quyền truy cập", 403));
    }
    req.authRole = user.role;
    next();
  } catch (error) {
    next(error);
  }
};

export default requireAdmin;
