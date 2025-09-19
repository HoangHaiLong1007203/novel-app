import Chapter from "../models/Chapter.js";
import Novel from "../models/Novel.js";
import AppError from "../middlewares/errorHandler.js";

// Tạo chapter mới
export const createChapter = async (req, res, next) => {
  try {
    const { novelId } = req.params;
    const { chapterNumber, title, content, isLocked, price } = req.body;

    const novel = await Novel.findById(novelId);
    if (!novel) {
      return next(new AppError("Truyện không tồn tại", 404));
    }

    if (novel.poster.toString() !== req.user.userId) {
      return next(new AppError("Bạn không có quyền tạo chapter cho truyện này", 403));
    }

    const chapter = new Chapter({
      novel: novelId,
      chapterNumber,
      title,
      content,
      isLocked: isLocked || false,
      price: price || 0,
    });

    await chapter.save();
    res.status(201).json({ message: "Chapter đã được tạo thành công", chapter });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách chapter của một truyện
export const getChaptersByNovel = async (req, res, next) => {
  try {
    const { novelId } = req.params;
    const { sort = 'asc' } = req.query;

    const sortOrder = sort === 'desc' ? -1 : 1;

    const chapters = await Chapter.find({ novel: novelId }).sort({ chapterNumber: sortOrder });

    res.json({ chapters });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết chapter
export const getChapterById = async (req, res, next) => {
  try {
    const { chapterId } = req.params;

    const chapter = await Chapter.findById(chapterId).populate('novel', 'title');
    if (!chapter) {
      return next(new AppError("Chapter không tồn tại", 404));
    }

    res.json({ chapter });
  } catch (error) {
    next(error);
  }
};

// Cập nhật chapter
export const updateChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return next(new AppError("Chapter không tồn tại", 404));
    }

    const novel = await Novel.findById(chapter.novel);
    if (novel.poster.toString() !== req.user.userId) {
      return next(new AppError("Bạn không có quyền cập nhật chapter này", 403));
    }

    const { chapterNumber, title, content, isLocked, price } = req.body;
    if (chapterNumber !== undefined) chapter.chapterNumber = chapterNumber;
    if (title !== undefined) chapter.title = title;
    if (content !== undefined) chapter.content = content;
    if (isLocked !== undefined) chapter.isLocked = isLocked;
    if (price !== undefined) chapter.price = price;

    await chapter.save();
    res.json({ message: "Chapter đã được cập nhật", chapter });
  } catch (error) {
    next(error);
  }
};

// Xóa chapter
export const deleteChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return next(new AppError("Chapter không tồn tại", 404));
    }

    const novel = await Novel.findById(chapter.novel);
    if (novel.poster.toString() !== req.user.userId) {
      return next(new AppError("Bạn không có quyền xóa chapter này", 403));
    }

    await Chapter.findByIdAndDelete(chapterId);
    res.json({ message: "Chapter đã được xóa" });
  } catch (error) {
    next(error);
  }
};
