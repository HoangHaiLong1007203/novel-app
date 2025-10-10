import Novel from "../models/Novel.js";
import User from "../models/User.js";
import AppError from "../middlewares/errorHandler.js";
import { uploadToCloudinary } from "../services/uploadService.js";

// Tạo truyện mới
export const createNovel = async (req, res, next) => {
  try {
    const { title, description, genres, type, author, status } = req.body;
    const poster = req.user.userId;

    if (!title || !type) {
      return next(new AppError("Title và type là bắt buộc", 400));
    }

    if (!["sáng tác", "dịch/đăng lại"].includes(type)) {
      return next(new AppError("Type phải là 'sáng tác' hoặc 'dịch/đăng lại'", 400));
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    let novelAuthor;
    if (type === "sáng tác") {
      novelAuthor = user.username;
    } else {
      if (!author) {
        return next(new AppError("Author là bắt buộc cho type 'dịch/đăng lại'", 400));
      }
      novelAuthor = author;
    }

    let coverImageUrl = "/default-cover.jpg";
    if (req.file) {
      coverImageUrl = await uploadToCloudinary(req.file.buffer, "novel-covers");
    }

    const novel = new Novel({
      title,
      author: novelAuthor,
      poster,
      type,
      description,
      genres: genres ? genres.split(",") : [],
      status: status || "còn tiếp",
      coverImageUrl,
    });

    await novel.save();
    res.status(201).json({ message: "Truyện đã được tạo thành công", novel });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách truyện với bộ lọc
export const getNovels = async (req, res, next) => {
  try {
    const { genres, author, poster, status } = req.query;
    const filter = {};

    if (genres) {
      filter.genres = { $in: genres.split(",") };
    }
    if (author) {
      filter.author = author;
    }
    if (poster) {
      filter.poster = poster;
    }
    if (status !== undefined) {
      filter.status = status;
    }

    const novels = await Novel.find(filter)
      .populate("poster", "username")
      .sort({ createdAt: -1 });

    res.json({ novels });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết truyện
export const getNovelById = async (req, res, next) => {
  try {
    const novel = await Novel.findById(req.params.id)
      .populate("poster", "username");

    if (!novel) {
      return next(new AppError("Truyện không tồn tại", 404));
    }

    res.json({ novel });
  } catch (error) {
    next(error);
  }
};

// Cập nhật truyện
export const updateNovel = async (req, res, next) => {
  try {
    const novel = await Novel.findById(req.params.id);

    if (!novel) {
      return next(new AppError("Truyện không tồn tại", 404));
    }

    if (novel.poster.toString() !== req.user.userId) {
      return next(new AppError("Bạn không có quyền cập nhật truyện này", 403));
    }

    const { title, description, genres, status } = req.body;
    if (title) novel.title = title;
    if (description !== undefined) novel.description = description;
    if (genres) novel.genres = genres.split(",");
    if (status !== undefined) novel.status = status;

    if (req.file) {
      novel.coverImageUrl = await uploadToCloudinary(req.file.buffer, "novel-covers");
    }

    await novel.save();
    res.json({ message: "Truyện đã được cập nhật", novel });
  } catch (error) {
    next(error);
  }
};

// Xóa truyện
export const deleteNovel = async (req, res, next) => {
  try {
    const novel = await Novel.findById(req.params.id);

    if (!novel) {
      return next(new AppError("Truyện không tồn tại", 404));
    }

    if (novel.poster.toString() !== req.user.userId) {
      return next(new AppError("Bạn không có quyền xóa truyện này", 403));
    }

    await Novel.findByIdAndDelete(req.params.id);
    res.json({ message: "Truyện đã được xóa" });
  } catch (error) {
    next(error);
  }
};
