import AppError from "../middlewares/errorHandler.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import {
  createCheckoutSession,
  retrieveCheckoutSession,
  constructWebhookEvent,
  hasStripeWebhookSecret,
} from "../services/stripeService.js";
import {
  createVnpayPayment,
  resolveVnpayReturnUrl,
  verifyVnpayReturn,
} from "../services/vnpayService.js";

const COIN_STEP = 10;
const MIN_COINS = 10;
const MAX_COINS = 100000;
const VND_PER_XU = 100;
const numberFormatter = new Intl.NumberFormat("vi-VN");

const normalizeProvider = (value) => {
  if (value === "stripe" || value === "vnpay") return value;
  throw new AppError("Phương thức thanh toán không được hỗ trợ", 400);
};

const ensureValidCoins = (coins) => {
  const parsed = Number(coins);
  if (!Number.isFinite(parsed)) {
    throw new AppError("Số xu không hợp lệ", 400);
  }
  if (parsed < MIN_COINS) {
    throw new AppError(`Số xu tối thiểu là ${MIN_COINS}`, 400);
  }
  if (parsed > MAX_COINS) {
    throw new AppError(`Số xu tối đa cho mỗi giao dịch là ${MAX_COINS.toLocaleString("vi-VN")}`, 400);
  }
  if (parsed % COIN_STEP !== 0) {
    throw new AppError(`Số xu phải là bội số của ${COIN_STEP}`, 400);
  }
  return parsed;
};

const coinsToVnd = (coins) => coins * VND_PER_XU;

const sanitizeOrderCode = (value) => value.replace(/[^0-9a-z]/gi, "").toUpperCase().slice(-16);

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildOrderCode = (provider) => {
  const base = `${provider || "pay"}-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
  return sanitizeOrderCode(base);
};

const resolveReturnUrl = (requestedUrl) => requestedUrl || resolveVnpayReturnUrl();

const getClientIp = (req) => {
  const header = req.headers["x-forwarded-for"];
  if (typeof header === "string" && header.length) {
    return header.split(",")[0].trim();
  }
  return req.connection?.remoteAddress || req.ip || "127.0.0.1";
};

const serializeTransaction = (doc) => ({
  id: doc._id,
  type: doc.type,
  provider: doc.provider,
  status: doc.status,
  amount: doc.amount,
  amountVnd: doc.amountVnd,
  orderCode: doc.orderCode,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const buildAdminTransactionPayload = async (transactionId) => {
  return Transaction.findById(transactionId)
    .populate("user", "username email role coins")
    .populate("novel", "title")
    .populate("chapter", "title chapterNumber")
    .lean();
};

const appendMetadata = (transaction, payloadKey, payloadValue) => {
  transaction.metadata = {
    ...(transaction.metadata || {}),
    [payloadKey]: payloadValue,
  };
};

const createTopupNotification = async (userId, transaction) => {
  const amountXu = numberFormatter.format(transaction.amount);
  const amountVnd = numberFormatter.format(transaction.amountVnd || coinsToVnd(transaction.amount));
  await Notification.create({
    user: userId,
    title: "Nạp xu thành công",
    message: `Bạn đã nạp ${amountXu} xu (~${amountVnd} VND).`,
    type: "topup",
  });
};

const applyTopupSuccess = async ({ transaction, reason, providerPayload }) => {
  if (transaction.status === "success") {
    const userDoc = await User.findById(transaction.user).select("coins");
    return { coins: userDoc?.coins ?? null, alreadyCompleted: true };
  }

  const userDoc = await User.findById(transaction.user);
  if (!userDoc) {
    throw new AppError("User không tồn tại", 404);
  }
  userDoc.coins += transaction.amount;
  await userDoc.save();

  transaction.status = "success";
  transaction.statusReason = reason || "Confirmed";
  if (providerPayload) {
    appendMetadata(transaction, "providerPayload", providerPayload);
  }
  await transaction.save();
  await createTopupNotification(userDoc._id, transaction);
  return { coins: userDoc.coins, alreadyCompleted: false };
};

const updateTransactionStatus = async (transaction, status, reason, providerPayload) => {
  transaction.status = status;
  transaction.statusReason = reason;
  if (providerPayload) {
    appendMetadata(transaction, "providerPayload", providerPayload);
  }
  await transaction.save();
  return transaction;
};

export const createPaymentSession = async (req, res, next) => {
  try {
    const coins = ensureValidCoins(req.body.coins);
    const provider = normalizeProvider(req.body.provider);
    const amountVnd = coinsToVnd(coins);
    const returnUrl = resolveReturnUrl(req.body.returnUrl);

    if (!returnUrl) {
      throw new AppError("Thiếu return URL để hoàn tất giao dịch", 400);
    }

    const orderCode = buildOrderCode(provider);
    const description = `Nạp ${coins.toLocaleString("vi-VN")} xu (~${amountVnd.toLocaleString("vi-VN")} VND)`;

    const transaction = await Transaction.create({
      user: req.user.userId,
      type: "topup",
      amount: coins,
      amountVnd,
      provider,
      status: "pending",
      description,
      orderCode,
      metadata: {},
    });

    let redirectUrl;

    if (provider === "stripe") {
      const successUrl = `${returnUrl}?provider=stripe&status=success&transactionId=${transaction._id}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${returnUrl}?provider=stripe&status=cancel&transactionId=${transaction._id}`;
      const session = await createCheckoutSession({
        amountVnd,
        successUrl,
        cancelUrl,
        metadata: {
          transactionId: transaction._id.toString(),
          orderCode,
        },
      });
      transaction.providerSessionId = session.id;
      transaction.providerRef = typeof session.payment_intent === "string" ? session.payment_intent : transaction.providerRef;
      appendMetadata(transaction, "stripeCheckout", {
        id: session.id,
        url: session.url,
        amount_total: session.amount_total,
      });
      redirectUrl = session.url;
    } else {
      // Ensure the frontend return URL contains provider and transactionId
      let returnUrlWithParams = returnUrl;
      try {
        const u = new URL(returnUrl);
        u.searchParams.set("provider", "vnpay");
        u.searchParams.set("transactionId", transaction._id.toString());
        returnUrlWithParams = u.toString();
      } catch (e) {
        // If returnUrl is not absolute or URL parsing fails, fall back to original
        // (frontend may still handle vnp_* params, but provider/transactionId will be missing)
      }

      const { paymentUrl, payload, txnRef } = createVnpayPayment({
        amountVnd,
        orderInfo: description,
        txnRef: orderCode,
        clientIp: getClientIp(req),
        returnUrl: returnUrlWithParams,
      });
      transaction.providerRef = txnRef;
      appendMetadata(transaction, "vnpRequest", payload);
      redirectUrl = paymentUrl;
    }

    await transaction.save();

    res.json({
      provider,
      transactionId: transaction._id,
      amountVnd,
      coins,
      redirectUrl,
    });
  } catch (error) {
    next(error);
  }
};

const ensureTransactionOwner = (transaction, userId) => {
  if (!transaction) {
    throw new AppError("Không tìm thấy giao dịch", 404);
  }
  if (transaction.user.toString() !== userId.toString()) {
    throw new AppError("Bạn không có quyền xem giao dịch này", 403);
  }
};

const buildStripePayloadSnapshot = (session) => ({
  id: session.id,
  status: session.status,
  payment_status: session.payment_status,
  amount_total: session.amount_total,
  currency: session.currency,
  payment_intent: session.payment_intent,
  metadata: session.metadata,
});

export const confirmPayment = async (req, res, next) => {
  try {
    const provider = normalizeProvider(req.body.provider);
    const transaction = await Transaction.findById(req.body.transactionId);
    ensureTransactionOwner(transaction, req.user.userId);

    if (transaction.status === "success") {
      const userDoc = await User.findById(transaction.user).select("coins");
      return res.json({
        status: "success",
        provider,
        coins: userDoc?.coins ?? null,
        transaction: serializeTransaction(transaction),
        message: "Giao dịch đã được xác nhận trước đó",
      });
    }

    if (provider === "stripe") {
      const sessionId = req.body.sessionId || transaction.providerSessionId;
      if (!sessionId) {
        throw new AppError("Thiếu Stripe sessionId", 400);
      }
      const session = await retrieveCheckoutSession(sessionId);
      if (session.metadata?.transactionId !== transaction._id.toString()) {
        throw new AppError("Stripe session không khớp giao dịch", 400);
      }

      appendMetadata(transaction, "stripeSession", buildStripePayloadSnapshot(session));
      transaction.providerSessionId = session.id;
      transaction.providerRef = typeof session.payment_intent === "string" ? session.payment_intent : transaction.providerRef;

      if (session.payment_status === "paid") {
        const result = await applyTopupSuccess({
          transaction,
          reason: "Stripe checkout thành công",
          providerPayload: buildStripePayloadSnapshot(session),
        });
        return res.json({
          status: "success",
          provider,
          coins: result.coins,
          transaction: serializeTransaction(transaction),
        });
      }

      const status = session.status === "expired" ? "canceled" : "failed";
      await updateTransactionStatus(transaction, status, "Stripe chưa xác nhận thanh toán", buildStripePayloadSnapshot(session));
      return res.json({
        status,
        provider,
        transaction: serializeTransaction(transaction),
        message: "Stripe chưa ghi nhận thanh toán. Vui lòng thử lại.",
      });
    }

    const rawParams = req.body.vnpParams;
    if (!rawParams || typeof rawParams !== "object") {
      throw new AppError("Thiếu thông tin phản hồi VNPAY", 400);
    }
    const verification = verifyVnpayReturn(rawParams);
    if (!verification.isValid) {
      await updateTransactionStatus(transaction, "failed", "Chữ ký VNPAY không hợp lệ", verification.payload);
      throw new AppError("Chữ ký VNPAY không hợp lệ", 400);
    }

    const payload = verification.payload;
    appendMetadata(transaction, "vnpReturn", payload);

    if (payload.vnp_TxnRef && transaction.providerRef && payload.vnp_TxnRef !== transaction.providerRef) {
      throw new AppError("Mã tham chiếu VNPAY không khớp", 400);
    }

    const amountFromVnp = payload.vnp_Amount ? Number(payload.vnp_Amount) / 100 : null;
    if (amountFromVnp && transaction.amountVnd && amountFromVnp !== transaction.amountVnd) {
      throw new AppError("Số tiền VNPAY không khớp", 400);
    }

    const responseCode = payload.vnp_ResponseCode;
    if (responseCode === "00") {
      const result = await applyTopupSuccess({
        transaction,
        reason: "VNPAY xác nhận",
        providerPayload: payload,
      });
      return res.json({
        status: "success",
        provider,
        coins: result.coins,
        transaction: serializeTransaction(transaction),
      });
    }

    const mappedStatus = responseCode === "24" ? "canceled" : "failed";
    await updateTransactionStatus(transaction, mappedStatus, `VNPAY trả về mã ${responseCode}`, payload);
    return res.json({
      status: mappedStatus,
      provider,
      transaction: serializeTransaction(transaction),
      responseCode,
    });
  } catch (error) {
    next(error);
  }
};

export const stripeWebhookHandler = async (req, res) => {
  if (!hasStripeWebhookSecret()) {
    return res.json({ skipped: true });
  }

  let event;
  try {
    event = constructWebhookEvent(req.rawBody, req.headers["stripe-signature"]);
  } catch (err) {
    console.error("Stripe webhook signature error", err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const handleSessionCompleted = async (session) => {
    if (!session.metadata?.transactionId) return;
    const transaction = await Transaction.findById(session.metadata.transactionId);
    if (!transaction) return;
    transaction.providerSessionId = session.id;
    transaction.providerRef = typeof session.payment_intent === "string" ? session.payment_intent : transaction.providerRef;
    appendMetadata(transaction, "stripeSession", buildStripePayloadSnapshot(session));
    await applyTopupSuccess({
      transaction,
      reason: `Stripe event ${event.type}`,
      providerPayload: buildStripePayloadSnapshot(session),
    }).catch((err) => console.error("Failed to apply Stripe webhook", err));
  };

  const handleSessionExpired = async (session) => {
    if (!session.metadata?.transactionId) return;
    const transaction = await Transaction.findById(session.metadata.transactionId);
    if (!transaction || transaction.status === "success") return;
    await updateTransactionStatus(transaction, "canceled", `Stripe event ${event.type}`, buildStripePayloadSnapshot(session));
  };

  switch (event.type) {
    case "checkout.session.completed":
      await handleSessionCompleted(event.data.object);
      break;
    case "checkout.session.expired":
      await handleSessionExpired(event.data.object);
      break;
    default:
      break;
  }

  res.json({ received: true });
};

export const listTransactions = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 200);
    const allowedStatuses = ["success", "failed", "pending", "canceled"];
    const allowedTypes = ["topup", "purchase"];
    const allowedProviders = ["stripe", "vnpay", "system"];

    const filter = {};
    filter.type = allowedTypes.includes(req.query.type) ? req.query.type : "topup";

    if (req.query.status && allowedStatuses.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    if (req.query.provider && allowedProviders.includes(req.query.provider)) {
      filter.provider = req.query.provider;
    }

    if (req.query.dateFrom || req.query.dateTo) {
      const createdAt = {};
      if (req.query.dateFrom) {
        const from = new Date(req.query.dateFrom);
        if (!Number.isNaN(from.getTime())) {
          createdAt.$gte = from;
        }
      }
      if (req.query.dateTo) {
        const to = new Date(req.query.dateTo);
        if (!Number.isNaN(to.getTime())) {
          to.setHours(23, 59, 59, 999);
          createdAt.$lte = to;
        }
      }
      if (Object.keys(createdAt).length) {
        filter.createdAt = createdAt;
      }
    }

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      const searchOr = [{ orderCode: regex }];
      const matchedUsers = await User.find({ $or: [{ username: regex }, { email: regex }] }).select("_id").lean();
      if (matchedUsers.length) {
        searchOr.push({ user: { $in: matchedUsers.map((doc) => doc._id) } });
      }
      filter.$or = searchOr;
    }

    const skip = (page - 1) * limit;
    const matchFilter = { ...filter };
    const summaryMatch = { ...filter };
    if (!filter.status) {
      summaryMatch.status = "success";
    }
    const providerMatch = { ...summaryMatch };
    const recentIssuesFilter = { ...filter };
    if (recentIssuesFilter.status) {
      delete recentIssuesFilter.status;
    }
    recentIssuesFilter.status = { $in: ["failed", "canceled"] };

    const [transactions, total, summaryRows, statusBreakdownRows, providerBreakdownRows, recentFailed] = await Promise.all([
      Transaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "username email role coins")
        .populate("novel", "title")
        .populate("chapter", "title chapterNumber")
        .lean(),
      Transaction.countDocuments(filter),
      Transaction.aggregate([
        { $match: summaryMatch },
        {
          $group: {
            _id: null,
            totalVnd: { $sum: { $ifNull: ["$amountVnd", { $multiply: ["$amount", VND_PER_XU] }] } },
            totalCoins: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      Transaction.aggregate([
        { $match: matchFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: providerMatch },
        {
          $group: {
            _id: "$provider",
            totalVnd: { $sum: { $ifNull: ["$amountVnd", { $multiply: ["$amount", VND_PER_XU] }] } },
            count: { $sum: 1 },
          },
        },
      ]),
      Transaction.find(recentIssuesFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("user", "username email")
        .lean(),
    ]);

    const summaryBlock = summaryRows[0] || { totalVnd: 0, totalCoins: 0, count: 0 };
    const statusBreakdown = statusBreakdownRows.map((row) => ({ status: row._id || "unknown", count: row.count }));
    const providerBreakdown = providerBreakdownRows.map((row) => ({ provider: row._id || "unknown", totalVnd: row.totalVnd, count: row.count }));
    const pagination = {
      currentPage: page,
      limit,
      total,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasNextPage: skip + transactions.length < total,
      hasPrevPage: page > 1,
    };

    res.json({
      success: true,
      summary: summaryBlock,
      statusBreakdown,
      providerBreakdown,
      transactions,
      pagination,
      recentFailed,
      filters: {
        statuses: allowedStatuses,
        providers: allowedProviders,
        types: allowedTypes,
      },
    });
  } catch (error) {
    next(error);
  }
};

const adminResolvableStatuses = ["success", "failed", "canceled"];

const sanitizeAdminReason = (reason, fallback) => {
  if (typeof reason === "string") {
    const trimmed = reason.trim();
    if (trimmed.length) {
      return trimmed.slice(0, 500);
    }
  }
  return fallback;
};

export const adminResolveTransaction = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const { status, reason } = req.body || {};
    const normalizedStatus = typeof status === "string" ? status.toLowerCase() : "";
    if (!adminResolvableStatuses.includes(normalizedStatus)) {
      throw new AppError("Trạng thái cập nhật không hợp lệ", 400);
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new AppError("Không tìm thấy giao dịch", 404);
    }

    const note = sanitizeAdminReason(reason, `Admin cập nhật thủ công (${normalizedStatus})`);
    let topupResult = null;

    if (normalizedStatus === "success") {
      if (transaction.type !== "topup") {
        throw new AppError("Chỉ hỗ trợ đánh dấu thành công cho giao dịch nạp xu", 400);
      }
      topupResult = await applyTopupSuccess({
        transaction,
        reason: note,
        providerPayload: { adminAction: "resolve", executedAt: new Date().toISOString() },
      });
    } else {
      await updateTransactionStatus(transaction, normalizedStatus, note, {
        adminAction: "resolve",
        executedAt: new Date().toISOString(),
      });
    }

    const payload = await buildAdminTransactionPayload(transactionId);
    res.json({
      success: true,
      transaction: payload,
      coins: topupResult?.coins ?? null,
      alreadyCompleted: topupResult?.alreadyCompleted ?? false,
    });
  } catch (error) {
    next(error);
  }
};

export const adminRetryTransaction = async (req, res, next) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new AppError("Không tìm thấy giao dịch", 404);
    }
    if (transaction.type !== "topup") {
      throw new AppError("Chỉ hỗ trợ đồng bộ cho giao dịch nạp xu", 400);
    }
    if (transaction.provider !== "stripe") {
      throw new AppError("Chức năng retry hiện chỉ hỗ trợ Stripe", 400);
    }

    const sessionId = transaction.providerSessionId;
    if (!sessionId) {
      throw new AppError("Giao dịch chưa có session Stripe", 400);
    }

    const session = await retrieveCheckoutSession(sessionId);
    const snapshot = buildStripePayloadSnapshot(session);
    appendMetadata(transaction, "adminRetry", {
      snapshot,
      executedAt: new Date().toISOString(),
    });
    transaction.providerSessionId = session.id;
    transaction.providerRef = typeof session.payment_intent === "string" ? session.payment_intent : transaction.providerRef;

    let topupResult = null;
    if (session.payment_status === "paid") {
      topupResult = await applyTopupSuccess({
        transaction,
        reason: "Admin đồng bộ Stripe",
        providerPayload: snapshot,
      });
    } else if (session.status === "expired") {
      await updateTransactionStatus(transaction, "canceled", "Stripe checkout đã hết hạn", snapshot);
    } else {
      await updateTransactionStatus(transaction, "pending", "Stripe chưa xác nhận thanh toán", snapshot);
    }

    const payload = await buildAdminTransactionPayload(transactionId);
    res.json({
      success: true,
      transaction: payload,
      coins: topupResult?.coins ?? null,
      alreadyCompleted: topupResult?.alreadyCompleted ?? false,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy lịch sử giao dịch của user (bao gồm topup và purchase)
export const listUserTransactions = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const query = { user: userId };
    // Cho phép lọc theo type (topup|purchase)
    if (req.query.type) {
      query.type = req.query.type;
    }

    const [items, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("novel", "title")
        .populate("chapter", "title chapterNumber")
        .lean(),
      Transaction.countDocuments(query),
    ]);

    res.json({
      transactions: items,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit) || 1,
        total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};
