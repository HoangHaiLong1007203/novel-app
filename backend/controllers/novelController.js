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

// Lấy danh sách truyện (listing)
export const getNovels = async (req, res, next) => {
  try {
    const { page, limit, genres, author, poster, status, type, chapterMin, chapterMax, sortBy } = req.query;
    const filter = {};
    filter.isDeleted = { $ne: true };

    const resolveSortStage = (value) => {
      switch (value) {
        case "updated_recent":
          return { updatedAt: -1, _id: 1 };
        case "views_desc":
          return { views: -1, _id: 1 };
        case "comments_desc":
          return { commentsCount: -1, _id: 1 };
        case "reviews_desc":
          return { averageRating: -1, _id: 1 };
        case "completed_recent":
          return { updatedAt: -1, _id: 1 };
        default:
          return { createdAt: -1, _id: 1 };
      }
    };

    // continue to build `filter` and pipeline below
    if (poster) {
      filter.poster = poster;
    }
    if (status) {
      filter.status = { $in: status.split(",") };
    }
    if (type) {
      filter.type = { $in: type.split(",") };
    }
    if (genres) {
      filter.genres = { $in: genres.split(",") };
    }

    const requiresAggregate = ["reviews_desc", "comments_desc"].includes(sortBy);

    // Use simple query when no chapter-range filters are provided and no aggregate-only sort is requested
    if (chapterMin === undefined && chapterMax === undefined && !requiresAggregate) {
        let query = Novel.find(filter).populate("poster", "username");

        // Pagination
        if (page && limit) {
          const skip = (parseInt(page) - 1) * parseInt(limit);
          query = query.skip(skip).limit(parseInt(limit));
        }

        const novels = await query.sort(resolveSortStage(sortBy));

        // If an `author` query was provided, also match by poster.username.
        // Use normalized comparison to handle case/diacritics differences between
        // stored `author` and the query (frontend sends the displayed author
        // string). Existing novels have `authorNormalized` saved at creation,
        // so compare against that when available.
        let novelsResult = novels;
        if (author) {
          const authorNorm = normalizeText(String(author));
          novelsResult = novels.filter((n) => {
            // prefer stored normalized author
            if (n.authorNormalized && n.authorNormalized === authorNorm) return true;
            // fallback to direct string compare of `author`
            if (n.author === author) return true;
            // also match poster.username when normalized
            if (n.poster && n.poster.username && normalizeText(n.poster.username) === authorNorm) return true;
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

    if (genres) filter.genres = { $in: genres.split(",") };
    if (author) filter.authorNormalized = normalizeText(String(author));
    if (poster) filter.poster = poster;
    if (status) filter.status = { $in: status.split(",") };
    if (type) filter.type = { $in: type.split(",") };

    // Build aggregation pipeline
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
    ];

    // Apply chapter count filter if provided (frontend sends chapterMin only when >0 and chapterMax only when <2100)
    if (chapterMin !== undefined || chapterMax !== undefined) {
      const chapterFilter = {};
      if (chapterMin !== undefined && parseInt(chapterMin) > 0) chapterFilter.$gte = parseInt(chapterMin);
      if (chapterMax !== undefined) {
        const cm = parseInt(chapterMax);
        // treat large sentinel (>=2000) as no upper bound
        if (cm < 2000) chapterFilter.$lte = cm;
      }
      if (Object.keys(chapterFilter).length) pipeline.push({ $match: { chapterCount: chapterFilter } });
    }

    // reviews count
    pipeline.push(
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
      // comments count
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
      // average rating
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
      { $unwind: { path: "$poster", preserveNullAndEmptyArrays: true } }
    );

    // Determine sort stage
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

    pipeline.push({ $project: { chapters: 0, reviewCount: 0, commentCount: 0, avgRating: 0 } });

    const novelsAgg = await Novel.aggregate(pipeline);

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
        if (chapterMin !== undefined && parseInt(chapterMin) > 0) {
          chapterFilter.$gte = parseInt(chapterMin);
        }
        if (chapterMax !== undefined) {
          const cm = parseInt(chapterMax);
          if (cm < 2000) {
            chapterFilter.$lte = cm;
          }
        }
        // Insert after $addFields chapterCount (after index 2)
        if (Object.keys(chapterFilter).length) {
          countPipeline.splice(3, 0, {
            $match: { chapterCount: chapterFilter }
          });
        }
      }
      countPipeline.push({ $count: "total" });

      const totalResult = await Novel.aggregate(countPipeline);
      const total = totalResult[0]?.total || 0;
      const totalPages = Math.ceil(total / parseInt(limit));

      res.json({
        novels: novelsAgg,
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
        novels: novelsAgg
      });
    }
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết truyện
export const getNovelById = async (req, res, next) => {
  try {
    const novel = await Novel.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
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

    if (!novel || novel.isDeleted) {
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

    if (!novel || novel.isDeleted) {
      return next(new AppError("Truyện không tồn tại", 404));
    }

    const user = await User.findById(req.user.userId).select("role");
    const isAdmin = user?.role === "admin";
    if (novel.poster.toString() !== req.user.userId && !isAdmin) {
      return next(new AppError("Bạn không có quyền xóa truyện này", 403));
    }

    novel.isDeleted = true;
    novel.deletedAt = new Date();
    await novel.save();

    if (isAdmin && novel.poster) {
      const reason = (req.body?.reason || "").toString().trim();
      const reasonText = reason ? ` Lý do: ${reason}` : "";
      await Notification.create({
        user: novel.poster,
        title: "Truyện bị xóa",
        message: `Truyện: ${novel.title} do bạn tạo đã bị xóa bởi admin.${reasonText}`,
        type: "system",
        relatedNovel: novel._id,
      });
    }

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
    // Build optional filter from query params (so search can be combined with filters)
    const { genres, status, type, chapterMin, chapterMax } = req.query;
    const filter = { isDeleted: { $ne: true } };
    if (genres) filter.genres = { $in: String(genres).split(",") };
    if (status) filter.status = { $in: String(status).split(",") };
    if (type) filter.type = { $in: String(type).split(",") };

    // Base pipeline: apply filter first, then compute search score
    const basePipeline = [];
    if (Object.keys(filter).length) basePipeline.push({ $match: filter });
    basePipeline.push(
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
      { $sort: { score: -1, updatedAt: -1 } }
    );

    // Count total matching documents (include chapterCount if chapter filters present)
    let countPipeline = [...basePipeline];
    // if chapter filters exist, compute chapterCount and match
    if (chapterMin !== undefined || chapterMax !== undefined) {
      countPipeline.push({ $lookup: { from: "chapters", localField: "_id", foreignField: "novel", as: "chapters" } });
      countPipeline.push({ $addFields: { chapterCount: { $size: "$chapters" } } });
      const chapterFilter = {};
      if (chapterMin !== undefined && parseInt(chapterMin) > 0) chapterFilter.$gte = parseInt(chapterMin);
      if (chapterMax !== undefined) {
        const cm = parseInt(chapterMax);
        if (cm < 2000) chapterFilter.$lte = cm;
      }
      if (Object.keys(chapterFilter).length) countPipeline.push({ $match: { chapterCount: chapterFilter } });
    }
    countPipeline.push({ $count: "total" });
    const totalResult = await Novel.aggregate(countPipeline);
    const total = totalResult[0]?.total || 0;

    // Extend pipeline to include derived fields for UI (chapterCount, commentsCount, averageRating)
    const novelsPipeline = [
      ...basePipeline,
      // chapters
      {
        $lookup: {
          from: "chapters",
          localField: "_id",
          foreignField: "novel",
          as: "chapters",
        },
      },
      { $addFields: { chapterCount: { $size: "$chapters" } } },
      // reviews count and avg
      {
        $lookup: {
          from: "reviews",
          let: { novelId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$novel", "$$novelId"] }, { $eq: ["$parentReview", null] }, { $eq: ["$isDeleted", false] }] } } },
            { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
          ],
          as: "reviewStats",
        },
      },
      { $addFields: { averageRating: { $ifNull: [{ $round: [{ $arrayElemAt: ["$reviewStats.avgRating", 0] }, 1] }, 0] }, reviewCount: { $ifNull: [{ $arrayElemAt: ["$reviewStats.count", 0] }, 0] } } },
      // comments count
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
      // remove heavy arrays
      { $project: { chapters: 0, reviewStats: 0, commentCount: 0 } },
    ];

    // If chapter filters exist, insert a match on chapterCount after it's computed
    if (chapterMin !== undefined || chapterMax !== undefined) {
      const chapterFilter = {};
      if (chapterMin !== undefined && parseInt(chapterMin) > 0) chapterFilter.$gte = parseInt(chapterMin);
      if (chapterMax !== undefined) {
        const cm = parseInt(chapterMax);
        if (cm < 2000) chapterFilter.$lte = cm;
      }
      if (Object.keys(chapterFilter).length) {
        const idx = novelsPipeline.findIndex((s) => s.$addFields && s.$addFields.chapterCount !== undefined);
        if (idx !== -1) novelsPipeline.splice(idx + 1, 0, { $match: { chapterCount: chapterFilter } });
      }
    }

    // Determine sort stage based on sortBy param
    const sortBy = req.query.sortBy;
    let sortStage = { $sort: { score: -1, updatedAt: -1 } };
    switch (sortBy) {
      case "latest":
        sortStage = { $sort: { createdAt: -1, _id: 1 } };
        break;
      case "oldest":
        sortStage = { $sort: { createdAt: 1, _id: 1 } };
        break;
      case "mostChapters":
        sortStage = { $sort: { chapterCount: -1, _id: 1 } };
        break;
      case "leastChapters":
        sortStage = { $sort: { chapterCount: 1, _id: 1 } };
        break;
      case "views_desc":
        sortStage = { $sort: { views: -1, _id: 1 } };
        break;
      case "reviews_desc":
        sortStage = { $sort: { reviewCount: -1, _id: 1 } };
        break;
      case "comments_desc":
        sortStage = { $sort: { commentsCount: -1, _id: 1 } };
        break;
      case "completed_recent":
        sortStage = { $sort: { updatedAt: -1, _id: 1 } };
        break;
      case "updated_recent":
        sortStage = { $sort: { updatedAt: -1, _id: 1 } };
        break;
      default:
        // keep default score sort
        sortStage = { $sort: { score: -1, updatedAt: -1 } };
    }

    // push sort, pagination and final projection
    novelsPipeline.push(sortStage, { $skip: skip }, { $limit: l }, { $project: { _id: 1, title: 1, author: 1, description: 1, genres: 1, coverImageUrl: 1, poster: { username: 1 }, score: 1, status: 1, views: 1, commentsCount: 1, averageRating: 1, chapterCount: 1 } });

    const novels = await Novel.aggregate(novelsPipeline);
    const totalPages = Math.ceil(total / l);
    res.json({ novels, pagination: { page: p, limit: l, total, totalPages } });
  } catch (error) {
    next(error);
  }
};
