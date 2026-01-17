import mongoose from "mongoose";
import AppError from "../middlewares/errorHandler.js";
import Report from "../models/Report.js";
import User from "../models/User.js";

const ALLOWED_STATUSES = ["pending", "reviewing", "resolved", "dismissed"];
const ALLOWED_TARGET_TYPES = ["novel", "chapter", "comment", "review", "user", "system"];
const ALLOWED_PRIORITIES = ["low", "medium", "high"];
const ALLOWED_CATEGORIES = ["spam", "abuse", "copyright", "nsfw", "other"];

const buildSearchFilter = async (search) => {
  if (!search) return {};
  const trimmed = search.trim();
  if (!trimmed.length) return {};
  const regex = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const reporterMatches = await User.find({
    $or: [{ username: regex }, { email: regex }],
  })
    .select("_id")
    .lean();
  const reporterIds = reporterMatches.map((doc) => doc._id);
  return {
    $or: [
      { targetTitle: regex },
      { targetSnippet: regex },
      { reason: regex },
      ...(reporterIds.length ? [{ reporter: { $in: reporterIds } }] : []),
    ],
  };
};

const normalizeDateRange = (dateFrom, dateTo) => {
  const createdAt = {};
  if (dateFrom) {
    const from = new Date(dateFrom);
    if (!Number.isNaN(from.getTime())) {
      createdAt.$gte = from;
    }
  }
  if (dateTo) {
    const to = new Date(dateTo);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      createdAt.$lte = to;
    }
  }
  return Object.keys(createdAt).length ? createdAt : null;
};

export const listReports = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 200);

    const filter = {};
    if (req.query.status && ALLOWED_STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.targetType && ALLOWED_TARGET_TYPES.includes(req.query.targetType)) {
      filter.targetType = req.query.targetType;
    }
    if (req.query.priority && ALLOWED_PRIORITIES.includes(req.query.priority)) {
      filter.priority = req.query.priority;
    }
    if (req.query.category && ALLOWED_CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category;
    }
    const range = normalizeDateRange(req.query.dateFrom, req.query.dateTo);
    if (range) {
      filter.createdAt = range;
    }

    const searchFilter = await buildSearchFilter(req.query.search);
    if (Object.keys(searchFilter).length) {
      filter.$and = [searchFilter];
    }

    const skip = (page - 1) * limit;

    const [reports, total, statusBreakdownRows, categoryBreakdownRows, priorityBreakdownRows] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("reporter", "username email role")
        .populate("assignedTo", "username email role")
        .lean(),
      Report.countDocuments(filter),
      Report.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $match: filter },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Report.aggregate([
        { $match: filter },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
    ]);

    const summary = {
      totalReports: total,
      pendingCount: statusBreakdownRows.find((row) => row._id === "pending")?.count || 0,
      reviewingCount: statusBreakdownRows.find((row) => row._id === "reviewing")?.count || 0,
      resolvedToday: await Report.countDocuments({
        status: "resolved",
        resolvedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    };

    const pagination = {
      currentPage: page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      total,
      hasNextPage: skip + reports.length < total,
      hasPrevPage: page > 1,
    };

    res.json({
      success: true,
      summary,
      statusBreakdown: statusBreakdownRows.map((row) => ({ status: row._id || "unknown", count: row.count })),
      categoryBreakdown: categoryBreakdownRows.map((row) => ({ category: row._id || "other", count: row.count })),
      priorityBreakdown: priorityBreakdownRows.map((row) => ({ priority: row._id || "medium", count: row.count })),
      filters: {
        statuses: ALLOWED_STATUSES,
        targetTypes: ALLOWED_TARGET_TYPES,
        priorities: ALLOWED_PRIORITIES,
        categories: ALLOWED_CATEGORIES,
      },
      reports,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReportStatus = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      throw new AppError("Report không hợp lệ", 400);
    }
    const { status, priority, resolutionNote } = req.body || {};
    const update = {};
    if (status) {
      if (!ALLOWED_STATUSES.includes(status)) {
        throw new AppError("Trạng thái không hợp lệ", 400);
      }
      update.status = status;
      if (status === "resolved") {
        update.resolvedAt = new Date();
      }
    }
    if (priority) {
      if (!ALLOWED_PRIORITIES.includes(priority)) {
        throw new AppError("Độ ưu tiên không hợp lệ", 400);
      }
      update.priority = priority;
    }
    if (resolutionNote) {
      update.resolutionNote = resolutionNote.trim();
    }

    if (!Object.keys(update).length) {
      throw new AppError("Thiếu dữ liệu cập nhật", 400);
    }

    const report = await Report.findByIdAndUpdate(reportId, update, { new: true })
      .populate("reporter", "username email role")
      .populate("assignedTo", "username email role")
      .lean();
    if (!report) {
      throw new AppError("Không tìm thấy report", 404);
    }
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};
