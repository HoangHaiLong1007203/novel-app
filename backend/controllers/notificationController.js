import Notification from "../models/Notification.js";
import AppError from "../middlewares/errorHandler.js";

// Lấy danh sách thông báo của user
export const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, isRead } = req.query;

    let query = { user: userId };
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(query)
      .populate('relatedNovel', 'title')
      .populate('relatedChapter', 'title chapterNumber')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      unreadCount
    });
  } catch (error) {
    next(error);
  }
};

// Đánh dấu một thông báo đã đọc
export const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return next(new AppError("Thông báo không tồn tại", 404));
    }

    res.json({ message: "Đã đánh dấu đã đọc", notification });
  } catch (error) {
    next(error);
  }
};

// Đánh dấu nhiều thông báo đã đọc
export const markMultipleAsRead = async (req, res, next) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user.userId;

    // Validate that notificationIds is provided and is an array
    if (!notificationIds) {
      return next(new AppError("notificationIds là bắt buộc", 400));
    }

    if (!Array.isArray(notificationIds)) {
      return next(new AppError("notificationIds phải là một mảng", 400));
    }

    if (notificationIds.length === 0) {
      return next(new AppError("Danh sách thông báo không được rỗng", 400));
    }

    const result = await Notification.updateMany(
      { _id: { $in: notificationIds }, user: userId },
      { isRead: true }
    );

    res.json({
      message: `Đã đánh dấu ${result.modifiedCount} thông báo đã đọc`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};

// Đánh dấu tất cả thông báo đã đọc
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );

    res.json({
      message: `Đã đánh dấu ${result.modifiedCount} thông báo đã đọc`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};
