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

      if (page && limit) {
        const total = await Novel.countDocuments(filter);
        const totalPages = Math.ceil(total / parseInt(limit));

        return res.json({
          novels,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages
          }
        });
      } else {
        return res.json({ novels });
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
          as: "chapters"
        }
      },
      {
        $addFields: {
          chapterCount: { $size: "$chapters" }
        }
      },
      {
        $lookup: {
          from: "reviews",
          let: { novelId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$novel", "$$novelId"] }, { $eq: ["$parentReview", null] }, { $eq: ["$isDeleted", false] }] } } },
            { $count: "count" }
          ],
          as: "reviewCount"
        }
      },
      {
        $addFields: {
          reviewCount: { $ifNull: [{ $arrayElemAt: ["$reviewCount.count", 0] }, 0] }
        }
      },
      {
        $lookup: {
          from: "comments",
          let: { novelId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$novel", "$$novelId"] }, { $eq: ["$parentComment", null] }, { $eq: ["$isDeleted", false] }] } } },
            { $count: "count" }
          ],
          as: "commentCount"
        }
      },
      {
        $addFields: {
          commentsCount: { $ifNull: [{ $arrayElemAt: ["$commentCount.count", 0] }, 0] }
        }
      },
      {
        $lookup: {
          from: "reviews",
          let: { novelId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$novel", "$$novelId"] }, { $eq: ["$parentReview", null] }, { $eq: ["$isDeleted", false] }] } } },
            { $group: { _id: null, avgRating: { $avg: "$rating" } } }
          ],
          as: "avgRating"
        }
      },
      {
        $addFields: {
          averageRating: { $ifNull: [{ $round: [{ $arrayElemAt: ["$avgRating.avgRating", 0] }, 1] }, 0] }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "poster",
          foreignField: "_id",
          as: "poster"
        }
      },
      {
        $unwind: { path: "$poster", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          chapters: 0,
          reviewCount: 0,
          commentCount: 0,
          avgRating: 0
        }
      }
    ];

    // Apply chapter range filter
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
      pipeline.splice(1, 0, {
        $match: { chapterCount: chapterFilter }
      });
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sortBy) {
      switch (sortBy) {
        case "comments_asc":
          sortOption = { commentsCount: 1 };
          break;
        case "comments_desc":
          sortOption = { commentsCount: -1 };
          break;
        case "reviews_asc":
          sortOption = { reviewCount: 1 };
          break;
        case "reviews_desc":
          sortOption = { reviewCount: -1 };
          break;
        case "rating_asc":
          sortOption = { averageRating: 1 };
          break;
        case "rating_desc":
          sortOption = { averageRating: -1 };
          break;
        default:
          sortOption = { createdAt: -1 };
      }
    }
    pipeline.push({ $sort: sortOption });

    // Pagination
    let novels;
    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: parseInt(limit) });
      novels = await Novel.aggregate(pipeline);
    } else {
      novels = await Novel.aggregate(pipeline);
    }

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
        countPipeline.splice(1, 0, {
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
