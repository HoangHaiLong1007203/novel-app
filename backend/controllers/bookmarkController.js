import Bookmark from "../models/Bookmark.js";
import Novel from "../models/Novel.js";
import AppError from "../middlewares/errorHandler.js";

// Thêm bookmark cho một truyện
export const addBookmark = async (req, res, next) => {
  try {
    const { novelId } = req.params;
    const userId = req.user.userId;

    // Kiểm tra truyện có tồn tại không
    const novel = await Novel.findById(novelId);
    if (!novel) {
      return next(new AppError("Truyện không tồn tại", 404));
    }

    // Kiểm tra xem đã bookmark chưa
    const existingBookmark = await Bookmark.findOne({ user: userId, novel: novelId });
    if (existingBookmark) {
      return next(new AppError("Bạn đã bookmark truyện này rồi", 400));
    }

    // Tạo bookmark mới
    const bookmark = new Bookmark({
      user: userId,
      novel: novelId,
    });

    await bookmark.save();
    res.status(201).json({ message: "Đã thêm bookmark thành công", bookmark });
  } catch (error) {
    next(error);
  }
};

// Bỏ bookmark một truyện
export const removeBookmark = async (req, res, next) => {
  try {
    const { novelId } = req.params;
    const userId = req.user.userId;

    const bookmark = await Bookmark.findOneAndDelete({ user: userId, novel: novelId });
    if (!bookmark) {
      return next(new AppError("Bookmark không tồn tại", 404));
    }

    res.json({ message: "Đã bỏ bookmark thành công" });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách bookmark của user
export const getUserBookmarks = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const bookmarks = await Bookmark.find({ user: userId })
      .populate('novel', 'title author type description genres status coverImageUrl views averageRating')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Bookmark.countDocuments({ user: userId });

    res.json({
      bookmarks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBookmarks: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};
