import ReadingProgress from "../models/ReadingProgress.js";
import Novel from "../models/Novel.js";
import Chapter from "../models/Chapter.js";
import AppError from "../middlewares/errorHandler.js";

// Create or update reading progress
export const createReadingProgress = async (req, res, next) => {
  try {
    const { novelId, chapterId, isRead, timeSpent = 0, startedAt, completedAt, notifyOnNewChapter } = req.body;
    const userId = req.user.userId;

    if (!novelId || !chapterId) {
      return next(new AppError("Novel ID và Chapter ID là bắt buộc", 400));
    }

    // Verify novel exists
    const novel = await Novel.findById(novelId);
    if (!novel) {
      return next(new AppError("Truyện không tồn tại", 404));
    }

    // Verify chapter exists
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return next(new AppError("Chương không tồn tại", 404));
    }

    // Get or create reading progress
    let readingProgress = await ReadingProgress.findOne({
      user: userId,
      novel: novelId
    });

    if (!readingProgress) {
      readingProgress = new ReadingProgress({
        user: userId,
        novel: novelId,
        readChapters: [],
        readingSessions: [],
        notifyOnNewChapter: !!notifyOnNewChapter,
      });
    } else if (notifyOnNewChapter !== undefined) {
      // allow caller to toggle subscription when creating/updating progress via this endpoint
      readingProgress.notifyOnNewChapter = !!notifyOnNewChapter;
      await readingProgress.save();
    }

    // Add chapter to read chapters and always record a reading session
    const chapterIdStr = chapterId.toString();
    const alreadyRead = readingProgress.readChapters.some(id => id.toString() === chapterIdStr);
    if (isRead) {
      const sessionTimes = {
        startedAt: startedAt ? new Date(startedAt) : undefined,
        completedAt: completedAt ? new Date(completedAt) : undefined,
      };
      // addReadChapter will always append a reading session and only add to readChapters once
      readingProgress.addReadChapter(chapterId, timeSpent, sessionTimes);

      // Calculate completion percentage (may not change if already read)
      const totalChapters = await Chapter.countDocuments({ novel: novelId });
      readingProgress.calculateCompletionPercentage(totalChapters);

      await readingProgress.save();
    }

    // If user marked chapter as read (even if already read), record a view increment
    if (isRead) {
      try {
        const last = readingProgress.lastViewIncrementAt ? new Date(readingProgress.lastViewIncrementAt).getTime() : 0;
        const now = Date.now();
        // only increment once per minute per user-novel
        if (!last || now - last >= 60_000) {
          await Novel.findByIdAndUpdate(novelId, { $inc: { views: 1 } });
          readingProgress.lastViewIncrementAt = new Date();
          await readingProgress.save();
        }
      } catch (e) {
        // don't fail the whole request if view increment fails; log and continue
        console.error('Failed to increment novel views:', e);
      }
    }

    res.status(201).json({
      message: "Tiến trình đọc đã được cập nhật",
      readingProgress: {
        novel: readingProgress.novel,
        readChapters: readingProgress.readChapters,
        totalChaptersRead: readingProgress.totalChaptersRead,
        completionPercentage: readingProgress.completionPercentage,
        canReview: readingProgress.canReview,
        lastReadAt: readingProgress.lastReadAt,
        notifyOnNewChapter: !!readingProgress.notifyOnNewChapter,
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get reading progress for a novel
export const getReadingProgress = async (req, res, next) => {
  try {
    const { novelId } = req.params;
    const userId = req.user.userId;

    if (!novelId) {
      return next(new AppError("Novel ID là bắt buộc", 400));
    }

    // Verify novel exists
    const novel = await Novel.findById(novelId);
    if (!novel) {
      return next(new AppError("Truyện không tồn tại", 404));
    }

    const readingProgress = await ReadingProgress.findOne({
      user: userId,
      novel: novelId
    }).populate('readChapters', 'chapterNumber title');

    if (!readingProgress) {
      return res.json({
        message: "Chưa có tiến trình đọc cho truyện này",
        readingProgress: null
      });
    }

    res.json({
      readingProgress: {
        novel: readingProgress.novel,
        readChapters: readingProgress.readChapters,
        totalChaptersRead: readingProgress.totalChaptersRead,
        completionPercentage: readingProgress.completionPercentage,
        canReview: readingProgress.canReview,
        lastReadAt: readingProgress.lastReadAt,
        readingSessions: readingProgress.readingSessions,
        notifyOnNewChapter: !!readingProgress.notifyOnNewChapter,
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all reading progress for current user
export const getAllReadingProgress = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const readingProgressList = await ReadingProgress.find({
      user: userId
    })
    .populate('novel', 'title description coverImageUrl averageRating')
    .sort({ lastReadAt: -1 })
    .skip(skip)
    .limit(limitNum);

    const total = await ReadingProgress.countDocuments({ user: userId });

    res.json({
      readingProgress: readingProgressList,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update reading progress (mark multiple chapters as read)
export const updateReadingProgress = async (req, res, next) => {
  try {
    const { novelId } = req.params;
    const { readChapterIds, timeSpent = 0, notifyOnNewChapter } = req.body;
    const userId = req.user.userId;

    if (!novelId) {
      return next(new AppError("Novel ID là bắt buộc", 400));
    }

    // readChapterIds is optional here — caller may only toggle notifyOnNewChapter
    if (readChapterIds !== undefined && readChapterIds !== null && !Array.isArray(readChapterIds)) {
      return next(new AppError("readChapterIds phải là một mảng", 400));
    }

    // Verify novel exists
    const novel = await Novel.findById(novelId);
    if (!novel) {
      return next(new AppError("Truyện không tồn tại", 404));
    }

    // Get or create reading progress
    let readingProgress = await ReadingProgress.findOne({
      user: userId,
      novel: novelId
    });

    if (!readingProgress) {
      readingProgress = new ReadingProgress({
        user: userId,
        novel: novelId,
        readChapters: [],
        readingSessions: [],
        notifyOnNewChapter: !!notifyOnNewChapter,
      });
    } else if (notifyOnNewChapter !== undefined) {
      readingProgress.notifyOnNewChapter = !!notifyOnNewChapter;
    }

    // Add new chapters to read chapters (if provided)
    let newChaptersAdded = 0;
    if (Array.isArray(readChapterIds) && readChapterIds.length) {
      for (const chapterId of readChapterIds) {
        const chapterIdStr = chapterId.toString();
        const alreadyRead = readingProgress.readChapters.some(id => id.toString() === chapterIdStr);
        if (!alreadyRead) {
          readingProgress.addReadChapter(chapterId, timeSpent);
          newChaptersAdded++;
        }
      }
    }

    // Calculate completion percentage
    const totalChapters = await Chapter.countDocuments({ novel: novelId });
    readingProgress.calculateCompletionPercentage(totalChapters);

    await readingProgress.save();

    // Rate-limited increment: at most 1 view per user-novel per minute
    if (newChaptersAdded > 0) {
      try {
        const last = readingProgress.lastViewIncrementAt ? new Date(readingProgress.lastViewIncrementAt).getTime() : 0;
        const now = Date.now();
        if (!last || now - last >= 60_000) {
          await Novel.findByIdAndUpdate(novelId, { $inc: { views: 1 } });
          readingProgress.lastViewIncrementAt = new Date();
          await readingProgress.save();
        }
      } catch (e) {
        console.error('Failed to increment novel views:', e);
      }
    }

    res.json({
      message: `${newChaptersAdded} chương mới đã được thêm vào tiến trình đọc`,
      readingProgress: {
        novel: readingProgress.novel,
        readChapters: readingProgress.readChapters,
        totalChaptersRead: readingProgress.totalChaptersRead,
        completionPercentage: readingProgress.completionPercentage,
        canReview: readingProgress.canReview,
        lastReadAt: readingProgress.lastReadAt,
        notifyOnNewChapter: !!readingProgress.notifyOnNewChapter,
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete reading progress for a novel
export const deleteReadingProgress = async (req, res, next) => {
  try {
    const { novelId } = req.params;
    const userId = req.user.userId;

    if (!novelId) {
      return next(new AppError("Novel ID là bắt buộc", 400));
    }

    const readingProgress = await ReadingProgress.findOneAndDelete({
      user: userId,
      novel: novelId
    });

    if (!readingProgress) {
      return next(new AppError("Không tìm thấy tiến trình đọc cho truyện này", 404));
    }

    res.json({
      message: "Tiến trình đọc đã được xóa"
    });
  } catch (error) {
    next(error);
  }
};
