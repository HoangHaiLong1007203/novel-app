import mongoose from "mongoose";
import User from "../models/User.js";
import AppError from "../middlewares/errorHandler.js";

const ALLOWED_ROLES = ["user", "admin"];
const ALLOWED_STATUSES = ["active", "banned"];

const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatActivityLabel = (user) => {
  if (user.status === "banned") {
    return `${user.username} bị khóa tài khoản`;
  }
  if (user.role === "admin") {
    return `${user.username} được cấp quyền admin`;
  }
  return `${user.username} vừa đăng ký`;
};

const buildUserStats = async () => {
  const today = startOfDay();
  const [totalUsers, newUsersToday, adminCount, bannedCount] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: today } }),
    User.countDocuments({ role: "admin" }),
    User.countDocuments({ status: "banned" }),
  ]);

  return {
    totalUsers,
    newUsersToday,
    adminCount,
    bannedCount,
  };
};

const buildRecentActivity = async () => {
  const rows = await User.find()
    .sort({ createdAt: -1 })
    .limit(6)
    .select("username role status createdAt")
    .lean();

  return rows.map((user) => ({
    id: user._id.toString(),
    label: formatActivityLabel(user),
    timestamp: user.createdAt,
    status: user.status,
    role: user.role,
  }));
};

export const getAdminUsers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 5), 100);
    const search = (req.query.search || "").trim();
    const role = ALLOWED_ROLES.includes(req.query.role) ? req.query.role : undefined;
    const status = ALLOWED_STATUSES.includes(req.query.status) ? req.query.status : undefined;
    const allowedSortFields = ["createdAt", "username", "coins"];
    const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : "createdAt";
    const sortDir = req.query.sortDir === "asc" ? 1 : -1;

    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [users, total, stats, recentActivity] = await Promise.all([
      User.find(filter)
        .sort({ [sortBy]: sortDir })
        .skip(skip)
        .limit(limit)
        .select("username email role status coins avatarUrl createdAt updatedAt providers")
        .lean(),
      User.countDocuments(filter),
      buildUserStats(),
      buildRecentActivity(),
    ]);

    const formattedUsers = users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email || "",
      role: user.role,
      status: user.status,
      coins: user.coins || 0,
      avatarUrl: user.avatarUrl || "",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      providers: (user.providers || []).map((p) => p.name),
    }));

    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasNextPage: skip + users.length < total,
      hasPrevPage: page > 1,
    };

    return res.json({
      success: true,
      stats,
      filters: {
        roles: ALLOWED_ROLES,
        statuses: ALLOWED_STATUSES,
      },
      users: formattedUsers,
      pagination,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new AppError("ID người dùng không hợp lệ", 400));
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return next(new AppError("Vai trò không hợp lệ", 400));
    }
    if (req.user?.userId === userId && role !== "admin") {
      return next(new AppError("Không thể tự hạ quyền của bạn", 400));
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true, select: "username role status" }
    );

    if (!user) {
      return next(new AppError("Không tìm thấy người dùng", 404));
    }

    return res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateAdminUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return next(new AppError("ID người dùng không hợp lệ", 400));
    }
    if (!ALLOWED_STATUSES.includes(status)) {
      return next(new AppError("Trạng thái không hợp lệ", 400));
    }
    if (req.user?.userId === userId && status === "banned") {
      return next(new AppError("Không thể tự khóa tài khoản", 400));
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true, runValidators: true, select: "username role status" }
    );

    if (!user) {
      return next(new AppError("Không tìm thấy người dùng", 404));
    }

    return res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
