import Novel from "../models/Novel.js";
import User from "../models/User.js";
import Chapter from "../models/Chapter.js";
import Review from "../models/Review.js";
import Comment from "../models/Comment.js";
import Bookmark from "../models/Bookmark.js";
import ReadingProgress from "../models/ReadingProgress.js";
import Notification from "../models/Notification.js";
import Transaction from "../models/Transaction.js";
import AppError from "../middlewares/errorHandler.js";
import { uploadToCloudinary } from "../services/uploadService.js";
import { normalizeText } from "../utils/normalize.js";

// Tạo truyện mới
export const createNovel = async (req, res, next) => {
  try {
    const { title, description, genres, type, author, status } = req.body;

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

    // Ensure for 'sáng tác' we always use the poster's username as author
    // and set authorUser to the user's _id. For 'dịch/đăng lại' author is
    // a free text string and authorUser stays null.
    let novelAuthor;
    let novelAuthorUser = null;
    if (type === "sáng tác") {
      novelAuthor = user.username;
      novelAuthorUser = user._id;
    } else {
      if (!author) {
        return next(new AppError("Author là bắt buộc cho type 'dịch/đăng lại'", 400));
      }
      novelAuthor = author;
      novelAuthorUser = null;
    }

    let coverImageUrl = "/default-cover.jpg";
    if (req.file) {
      coverImageUrl = await uploadToCloudinary(req.file.buffer, "novel-covers");
    }

    const novel = new Novel({
      title,
      titleNormalized: normalizeText(title),
      author: novelAuthor,
      authorNormalized: novelAuthor ? normalizeText(novelAuthor) : undefined,
      authorUser: novelAuthorUser,
      // store poster as the actual user _id to avoid accidental string/id mixups
      poster: user._id,
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
    const {
      genres,
      author,
      poster,
      status,
      type,
      chapterMin,
      chapterMax,
      sortBy,
      page = 1,
      limit = 20
    } = req.query;

    // Check if we need advanced features (chapter counts, reviews, etc.)
    const needsAggregation = chapterMin !== undefined || chapterMax !== undefined || sortBy;

    if (!needsAggregation) {
      // Simple query for basic cases (like upload page and me/novels page without advanced filters)
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
      if (status) {
        filter.status = { $in: status.split(",") };
      }
      if (type) {
        filter.type = { $in: type.split(",") };
      }

      let query = Novel.find(filter).populate("poster", "username");

      // Pagination
      if (page && limit) {
        const skip = (parseInt(page) - 1) * parseInt(limit);
        query = query.skip(skip).limit(parseInt(limit));
      }

      const novels = await query.sort({ createdAt: -1 });

      // If an `author` query was provided, also match by poster.username in
      // memory after populating `poster`. This handles cases where existing
      // records have `author` stored as an ObjectId (e.g. poster id) instead
      // of the author's username.
      let novelsResult = novels;
      if (author) {
        novelsResult = novels.filter(n => {
          if (n.author === author) return true;
          if (n.poster && n.poster.username === author) return true;
          return false;
        });
      }

      if (page && limit) {
        // Use filtered result length as total when author filter applied,
        // otherwise use the collection countDocuments for performance.
        const total = author ? novelsResult.length : await Novel.countDocuments(filter);
        const totalPages = Math.ceil(total / parseInt(limit));

        return res.json({
          novels: novelsResult,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages
          }
        });
      } else {
        return res.json({ novels: novelsResult });
      }
    }

    // Advanced aggregation for complex queries
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
    if (status) {
      filter.status = { $in: status.split(",") };
    }
    if (type) {
      filter.type = { $in: type.split(",") };
    }

    // Aggregation pipeline
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "chapters",
          localField: "_id",
          foreignField: "novel",
          as: "chapters",
        },
      },
      { $addFields: { chapterCount: { $size: "$chapters" } } },
      {
        $lookup: {
          from: "reviews",
          let: { novelId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$novel", "$$novelId"] }, { $eq: ["$parentReview", null] }, { $eq: ["$isDeleted", false] }] } } },
            { $count: "count" },
          ],
          as: "reviewCount",
        },
      },
      { $addFields: { reviewCount: { $ifNull: [{ $arrayElemAt: ["$reviewCount.count", 0] }, 0] } } },
      {
        $lookup: {
          from: "comments",
          let: { novelId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$novel", "$$novelId"] }, { $eq: ["$parentComment", null] }, { $eq: ["$isDeleted", false] }] } } },
            { $count: "count" },
          ],
          as: "commentCount",
        },
      },
      { $addFields: { commentsCount: { $ifNull: [{ $arrayElemAt: ["$commentCount.count", 0] }, 0] } } },
      {
        $lookup: {
          from: "reviews",
          let: { novelId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$novel", "$$novelId"] }, { $eq: ["$parentReview", null] }, { $eq: ["$isDeleted", false] }] } } },
            { $group: { _id: null, avgRating: { $avg: "$rating" } } },
          ],
          as: "avgRating",
        },
      },
      { $addFields: { averageRating: { $ifNull: [{ $round: [{ $arrayElemAt: ["$avgRating.avgRating", 0] }, 1] }, 0] } } },
      { $lookup: { from: "users", localField: "poster", foreignField: "_id", as: "poster" } },
      { $unwind: { path: "$poster", preserveNullAndEmptyArrays: true } },
      { $project: { chapters: 0, reviewCount: 0, commentCount: 0, avgRating: 0 } },
    ];

    // Add sort with _id as tiebreaker for stable pagination
    let sortStage = { $sort: { createdAt: -1, _id: 1 } };
    if (sortBy) {
      switch (sortBy) {
        case "updated_recent":
          sortStage = { $sort: { updatedAt: -1, _id: 1 } };
          break;
        case "views_desc":
          sortStage = { $sort: { views: -1, _id: 1 } };
          break;
        case "comments_desc":
          sortStage = { $sort: { commentsCount: -1, _id: 1 } };
          break;
        case "reviews_desc":
          sortStage = { $sort: { reviewCount: -1, _id: 1 } };
          break;
        case "completed_recent":
          // Sort by updatedAt for completed
          sortStage = { $sort: { updatedAt: -1, _id: 1 } };
          break;
        default:
          sortStage = { $sort: { createdAt: -1, _id: 1 } };
      }
    }
    pipeline.push(sortStage);

    // Add pagination if needed
    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      pipeline.push({ $skip: skip }, { $limit: parseInt(limit) });
    }

    const novels = await Novel.aggregate(pipeline);

    // Get total count only if pagination is requested
    if (page && limit) {
      const countPipeline = [
        { $match: filter },
        {
          $lookup: {
            from: "chapters",
            localField: "_id",
            foreignField: "novel",
            as: "chapters"
          }
        },
        {
          $addFields: {
            chapterCount: { $size: "$chapters" }
          }
        }
      ];
      if (chapterMin !== undefined || chapterMax !== undefined) {
        const chapterFilter = {};
        if (chapterMin !== undefined) {
          chapterFilter.$gte = parseInt(chapterMin);
        }
        if (chapterMax !== undefined) {
          if (chapterMax === "2000") {
            chapterFilter.$gte = 2000;
          } else {
            chapterFilter.$lte = parseInt(chapterMax);
          }
        }
        // Insert after $addFields chapterCount (after index 2)
        countPipeline.splice(3, 0, {
          $match: { chapterCount: chapterFilter }
        });
      }
      countPipeline.push({ $count: "total" });

      const totalResult = await Novel.aggregate(countPipeline);
      const total = totalResult[0]?.total || 0;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        novels,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      });
    } else {
      // No pagination, just return novels
      res.json({
        novels
      });
    }
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
  if (title) novel.titleNormalized = normalizeText(title);
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

// Xóa truyện (chỉ poster được xóa)
export const deleteNovel = async (req, res, next) => {
  try {
    const novel = await Novel.findById(req.params.id);

    if (!novel) {
      return next(new AppError("Truyện không tồn tại", 404));
    }

    if (novel.poster.toString() !== req.user.userId) {
      return next(new AppError("Bạn không có quyền xóa truyện này", 403));
    }

    // Delete related documents to avoid orphan data
    await Promise.all([
      Chapter.deleteMany({ novel: novel._id }),
      Review.deleteMany({ novel: novel._id }),
      Comment.deleteMany({ novel: novel._id }),
      Bookmark.deleteMany({ novel: novel._id }),
      ReadingProgress.deleteMany({ novel: novel._id }),
      Notification.deleteMany({ novel: novel._id }),
      Transaction.deleteMany({ novel: novel._id }),
    ]);

    await Novel.findByIdAndDelete(novel._id);

    res.json({ message: "Truyện đã được xóa" });
  } catch (error) {
    next(error);
  }
};

// Tìm kiếm truyện
export const searchNovels = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) return res.json({ novels: [], pagination: { page: 1, limit: parseInt(limit), total: 0, totalPages: 0 } });

    const query = String(q);
    const queryNorm = normalizeText(query);
    const p = Math.max(1, parseInt(String(page) || "1"));
    const l = Math.max(1, Math.min(100, parseInt(String(limit) || "20")));
    const skip = (p - 1) * l;

    const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
    const esc = escapeRegex(query);
    const escNorm = escapeRegex(queryNorm);

    // Pipeline: prefer exact title, then title contains, author contains,
    // then normalized matches for diacritic-insensitive fuzzy matches.
    const basePipeline = [
      { $lookup: { from: "users", localField: "poster", foreignField: "_id", as: "poster" } },
      { $unwind: { path: "$poster", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          score: {
            $add: [
              { $cond: [{ $regexMatch: { input: { $ifNull: [{ $toString: "$title" }, ""] }, regex: `^${esc}$`, options: "i" } }, 100, 0] },
              { $cond: [{ $regexMatch: { input: { $ifNull: [{ $toString: "$title" }, ""] }, regex: esc, options: "i" } }, 30, 0] },
              { $cond: [{ $regexMatch: { input: { $ifNull: [{ $toString: "$author" }, ""] }, regex: esc, options: "i" } }, 10, 0] },
              { $cond: [{ $regexMatch: { input: { $ifNull: [{ $toString: "$titleNormalized" }, ""] }, regex: escNorm, options: "i" } }, 3, 0] },
              { $cond: [{ $regexMatch: { input: { $ifNull: [{ $toString: "$authorNormalized" }, ""] }, regex: escNorm, options: "i" } }, 1, 0] },
            ],
          },
        },
      },
      { $match: { score: { $gt: 0 } } },
      { $sort: { score: -1, updatedAt: -1 } },
    ];

    const countPipeline = [...basePipeline, { $count: "total" }];
    const totalResult = await Novel.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    const novelsPipeline = [
      ...basePipeline,
      { $skip: skip },
      { $limit: l },
      { $project: { _id: 1, title: 1, author: 1, description: 1, genres: 1, coverImageUrl: 1, poster: { username: 1 }, score: 1 } },
    ];

    const novels = await Novel.aggregate(novelsPipeline);
    const totalPages = Math.ceil(total / l);
    res.json({ novels, pagination: { page: p, limit: l, total, totalPages } });
  } catch (error) {
    next(error);
  }
};
