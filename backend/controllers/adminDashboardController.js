import mongoose from "mongoose";
import Novel from "../models/Novel.js";
import User from "../models/User.js";
import Chapter from "../models/Chapter.js";
import Transaction from "../models/Transaction.js";
import Review from "../models/Review.js";

const VND_PER_XU = 100;
const numberFormatter = new Intl.NumberFormat("vi-VN");

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfNDaysAgo = (days) => {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - days);
  return d;
};

const percentChange = (current, previous) => {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Math.round(((current - previous) / previous) * 100);
};

const formatTimeAgo = (input) => {
  const date = new Date(input);
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "vừa xong";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

const formatReportedAt = (input) => {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(input));
};

const buildDailyCounts = async (Model, { match = {}, days = 7 } = {}) => {
  const startDate = startOfNDaysAgo(days - 1);
  const matchStage = {
    ...match,
    createdAt: {
      ...(match.createdAt || {}),
      $gte: startDate,
    },
  };

  const rows = await Model.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
  ]);

  const map = rows.reduce((acc, row) => {
    acc.set(row._id, row.count);
    return acc;
  }, new Map());

  return Array.from({ length: days }).map((_, idx) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + idx);
    const key = day.toISOString().slice(0, 10);
    return map.get(key) ?? 0;
  });
};

const buildRevenueDataset = async (days = 7) => {
  const startDate = startOfNDaysAgo(days - 1);
  const rows = await Transaction.aggregate([
    {
      $match: {
        type: { $in: ["topup", "withdraw"] },
        status: "success",
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        total: {
          $sum: {
            $cond: [
              { $eq: ["$type", "withdraw"] },
              {
                $multiply: [
                  -1,
                  { $ifNull: ["$amountVnd", { $multiply: ["$amount", VND_PER_XU] }] },
                ],
              },
              { $ifNull: ["$amountVnd", { $multiply: ["$amount", VND_PER_XU] }] },
            ],
          },
        },
      },
    },
  ]);

  const map = rows.reduce((acc, row) => {
    acc.set(row._id, row.total);
    return acc;
  }, new Map());

  return Array.from({ length: days }).map((_, idx) => {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + idx);
    const key = day.toISOString().slice(0, 10);
    const value = map.get(key) ?? 0;
    return Number((value / 1_000_000).toFixed(2));
  });
};

const sumRevenue = async (match) => {
  const rows = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $cond: [
              { $eq: ["$type", "withdraw"] },
              {
                $multiply: [
                  -1,
                  { $ifNull: ["$amountVnd", { $multiply: ["$amount", VND_PER_XU] }] },
                ],
              },
              { $ifNull: ["$amountVnd", { $multiply: ["$amount", VND_PER_XU] }] },
            ],
          },
        },
      },
    },
  ]);
  return rows[0]?.total ?? 0;
};

const buildSummaryMetrics = async () => {
  const now = new Date();
  const startOfToday = startOfDay(now);
  const currentWeekStart = startOfNDaysAgo(6);
  const previousWeekStart = startOfNDaysAgo(13);
  const previousWeekEnd = new Date(currentWeekStart.getTime() - 1);

  const [
    totalNovels,
    newNovelsCurrentWeek,
    newNovelsPreviousWeek,
    novelDataset,
    activeUsersCurrent,
    activeUsersPrevious,
    userDataset,
    chaptersToday,
    chapterDataset,
    revenueToday,
    revenueCurrentWeek,
    revenuePreviousWeek,
    revenueDataset,
  ] = await Promise.all([
    Novel.countDocuments(),
    Novel.countDocuments({ createdAt: { $gte: currentWeekStart } }),
    Novel.countDocuments({ createdAt: { $gte: previousWeekStart, $lte: previousWeekEnd } }),
    buildDailyCounts(Novel),
    User.countDocuments({ updatedAt: { $gte: currentWeekStart } }),
    User.countDocuments({ updatedAt: { $gte: previousWeekStart, $lte: previousWeekEnd } }),
    buildDailyCounts(User),
    Chapter.countDocuments({ createdAt: { $gte: startOfToday } }),
    buildDailyCounts(Chapter),
    sumRevenue({ type: { $in: ["topup", "withdraw"] }, status: "success", createdAt: { $gte: startOfToday } }),
    sumRevenue({ type: { $in: ["topup", "withdraw"] }, status: "success", createdAt: { $gte: currentWeekStart } }),
    sumRevenue({ type: { $in: ["topup", "withdraw"] }, status: "success", createdAt: { $gte: previousWeekStart, $lte: previousWeekEnd } }),
    buildRevenueDataset(),
  ]);

  return [
    {
      id: "novels",
      title: "Tổng truyện",
      value: numberFormatter.format(totalNovels),
      subLabel: `${numberFormatter.format(newNovelsCurrentWeek)} truyện mới / 7 ngày qua`,
      trendPercent: percentChange(newNovelsCurrentWeek, newNovelsPreviousWeek),
      dataset: novelDataset,
    },
    {
      id: "users",
      title: "Người dùng hoạt động",
      value: numberFormatter.format(activeUsersCurrent),
      subLabel: `So với tuần trước (${numberFormatter.format(activeUsersPrevious)})`,
      trendPercent: percentChange(activeUsersCurrent, activeUsersPrevious),
      dataset: userDataset,
    },
    {
      id: "chapters",
      title: "Chương xuất bản",
      value: numberFormatter.format(chaptersToday),
      subLabel: "Trong 24 giờ qua",
      trendPercent: percentChange(chaptersToday, chapterDataset[chapterDataset.length - 2] ?? 0),
      dataset: chapterDataset,
    },
    {
      id: "revenue",
      title: "Doanh thu hôm nay",
      value: `${numberFormatter.format(revenueToday)} ₫`,
      subLabel: "Top-up đã xác nhận",
      trendPercent: percentChange(revenueCurrentWeek, revenuePreviousWeek),
      dataset: revenueDataset,
    },
  ];
};

const buildActivityFeed = async () => {
  const [recentNovels, recentTopups, recentUsers] = await Promise.all([
    Novel.find().sort({ createdAt: -1 }).limit(6).populate("poster", "username").lean(),
    Transaction.find({ status: "success", type: "topup" })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("user", "username")
      .lean(),
    User.find().sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  const items = [
    ...recentNovels.map((novel) => ({
      id: `novel-${novel._id}`,
      actor: novel.poster?.username || "Ẩn danh",
      action: "đăng truyện",
      target: `"${novel.title}"`,
      timeAgo: formatTimeAgo(novel.createdAt),
      type: "novel",
      highlight: Date.now() - new Date(novel.createdAt).getTime() < 60 * 60 * 1000,
      timestamp: novel.createdAt,
    })),
    ...recentTopups.map((txn) => ({
      id: `topup-${txn._id}`,
      actor: txn.user?.username || "Người dùng",
      action: `nạp ${(txn.amountVnd || txn.amount * VND_PER_XU).toLocaleString("vi-VN")} ₫`,
      timeAgo: formatTimeAgo(txn.createdAt),
      type: "payment",
      highlight: txn.amountVnd ? txn.amountVnd >= 1_000_000 : txn.amount >= 10_000,
      timestamp: txn.createdAt,
    })),
    ...recentUsers.map((user) => ({
      id: `user-${user._id}`,
      actor: user.username,
      action: "vừa đăng ký",
      timeAgo: formatTimeAgo(user.createdAt),
      type: "user",
      highlight: true,
      timestamp: user.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 8)
    .map(({ timestamp, ...rest }) => rest);

  return items;
};

const buildModerationQueue = async () => {
  const recentNovels = await Novel.find()
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate("poster", "username")
    .lean();

  if (!recentNovels.length) return [];

  const novelIds = recentNovels.map((n) => n._id);
  const chapterCounts = await Chapter.aggregate([
    { $match: { novel: { $in: novelIds } } },
    { $group: { _id: "$novel", count: { $sum: 1 } } },
  ]);
  const countMap = chapterCounts.reduce((acc, row) => {
    acc.set(row._id.toString(), row.count);
    return acc;
  }, new Map());

  return recentNovels.map((novel) => {
    const totalChapters = countMap.get(novel._id.toString()) || 0;
    let status = "pending";
    if (novel.status === "tạm ngưng") {
      status = "snoozed";
    } else if ((novel.commentsCount || 0) >= 30) {
      status = "escalated";
    }

    let reason = `${totalChapters} chương - chờ duyệt metadata`;
    if (status === "snoozed") {
      reason = "Tác giả tạm ngưng, cần xác nhận";
    } else if (status === "escalated") {
      reason = `${novel.commentsCount} bình luận cần kiểm duyệt`;
    }

    return {
      id: novel._id.toString(),
      title: novel.title,
      author: novel.poster?.username ? `@${novel.poster.username}` : "Không rõ",
      reason,
      status,
      reportedAt: formatReportedAt(novel.updatedAt),
    };
  });
};

const buildPaymentSummary = async () => {
  const startDate = startOfDay(new Date());
  const rows = await Transaction.aggregate([
    {
      $match: { type: "topup", status: "success", createdAt: { $gte: startDate } },
    },
    {
      $group: {
        _id: "$provider",
        amount: {
          $sum: { $ifNull: ["$amountVnd", { $multiply: ["$amount", VND_PER_XU] }] },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const totalVnd = rows.reduce((sum, row) => sum + row.amount, 0);
  const totalTransactions = rows.reduce((sum, row) => sum + row.count, 0);

  const providerBreakdown = rows.map((row) => ({
    provider: (row._id || "Coins").toString().toUpperCase(),
    amount: row.amount,
    percentage: totalVnd ? Math.round((row.amount / totalVnd) * 100) : 0,
  }));

  return {
    totalVnd,
    totalTransactions,
    providerBreakdown,
  };
};

const buildTopNovels = async () => {
  const purchaseRows = await Transaction.aggregate([
    { $match: { type: "purchase", status: "success" } },
    {
      $group: {
        _id: "$novel",
        revenueCoins: { $sum: "$amount" },
        purchases: { $sum: 1 },
      },
    },
    { $sort: { revenueCoins: -1 } },
    { $limit: 5 },
  ]);

  if (!purchaseRows.length) return [];

  const novelIds = purchaseRows.map((row) => row._id).filter(Boolean);
  const [novels, reviewCounts] = await Promise.all([
    Novel.find({ _id: { $in: novelIds } })
      .populate("poster", "username")
      .select("title status poster")
      .lean(),
    Review.aggregate([
      {
        $match: {
          novel: { $in: novelIds },
          parentReview: null,
          isDeleted: false,
        },
      },
      { $group: { _id: "$novel", count: { $sum: 1 } } },
    ]),
  ]);

  const novelMap = novels.reduce((acc, novel) => {
    acc.set(novel._id.toString(), novel);
    return acc;
  }, new Map());
  const reviewMap = reviewCounts.reduce((acc, row) => {
    acc.set(row._id.toString(), row.count);
    return acc;
  }, new Map());

  return purchaseRows
    .map((row) => {
      const novel = novelMap.get(row._id?.toString());
      if (!novel) return null;
      return {
        id: row._id.toString(),
        title: novel.title,
        poster: novel.poster?.username ? `@${novel.poster.username}` : "Không rõ",
        revenue: row.revenueCoins * VND_PER_XU,
        reviews: reviewMap.get(row._id.toString()) || 0,
        status: novel.status,
      };
    })
    .filter(Boolean);
};

const buildSystemHealth = async () => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const [totalNovels, totalChapters, pendingTopups, lowRatingReviews] = await Promise.all([
    Novel.countDocuments(),
    Chapter.countDocuments(),
    Transaction.countDocuments({ type: "topup", status: "pending", createdAt: { $lte: fifteenMinutesAgo } }),
    Review.countDocuments({ parentReview: null, isDeleted: false, rating: { $lte: 2 } }),
  ]);

  const storagePercent = totalChapters ? Math.min(Math.round((totalChapters / 5000) * 100), 100) : 0;
  const dbStatus = mongoose.connection.readyState === 1 ? "ok" : "warn";

  return [
    {
      id: "db",
      label: "MongoDB",
      status: dbStatus,
      message:
        dbStatus === "ok"
          ? `${numberFormatter.format(totalNovels)} truyện đang được lưu`
          : "Không thể kết nối tới cơ sở dữ liệu",
    },
    {
      id: "storage",
      label: "Kho chương",
      status: storagePercent >= 80 ? "warn" : "ok",
      message: `${numberFormatter.format(totalChapters)} chương (~${storagePercent}% hạn mức đề xuất)`,
    },
    {
      id: "webhook",
      label: "Webhook thanh toán",
      status: pendingTopups > 0 ? "warn" : "ok",
      message:
        pendingTopups > 0
          ? `${pendingTopups} giao dịch chờ xác nhận > 15 phút`
          : "Không có giao dịch pending",
    },
    {
      id: "reports",
      label: "Đánh giá cần soát",
      status: lowRatingReviews > 20 ? "warn" : "ok",
      message: `${numberFormatter.format(lowRatingReviews)} review đánh giá thấp cần kiểm tra`,
    },
  ];
};

const respond = (res, payload) => res.json({ success: true, ...payload });

export const getSummary = async (req, res, next) => {
  try {
    const stats = await buildSummaryMetrics();
    respond(res, { stats });
  } catch (error) {
    next(error);
  }
};

export const getActivities = async (req, res, next) => {
  try {
    const activities = await buildActivityFeed();
    respond(res, { activities });
  } catch (error) {
    next(error);
  }
};

export const getModerationQueue = async (req, res, next) => {
  try {
    const moderationQueue = await buildModerationQueue();
    respond(res, { moderationQueue });
  } catch (error) {
    next(error);
  }
};

export const getPaymentSummary = async (req, res, next) => {
  try {
    const paymentSummary = await buildPaymentSummary();
    respond(res, { paymentSummary });
  } catch (error) {
    next(error);
  }
};

export const getTopNovels = async (req, res, next) => {
  try {
    const topNovels = await buildTopNovels();
    respond(res, { topNovels });
  } catch (error) {
    next(error);
  }
};

export const getSystemHealth = async (req, res, next) => {
  try {
    const systemHealth = await buildSystemHealth();
    respond(res, { systemHealth });
  } catch (error) {
    next(error);
  }
};

export const getDashboardOverview = async (req, res, next) => {
  try {
    const [stats, activities, moderationQueue, paymentSummary, topNovels, systemHealth] = await Promise.all([
      buildSummaryMetrics(),
      buildActivityFeed(),
      buildModerationQueue(),
      buildPaymentSummary(),
      buildTopNovels(),
      buildSystemHealth(),
    ]);

    respond(res, { stats, activities, moderationQueue, paymentSummary, topNovels, systemHealth });
  } catch (error) {
    next(error);
  }
};
