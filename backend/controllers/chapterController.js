import Chapter from "../models/Chapter.js";
import Novel from "../models/Novel.js";
import Bookmark from "../models/Bookmark.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import ReadingProgress from "../models/ReadingProgress.js";
import Transaction from "../models/Transaction.js";
import AppError from "../middlewares/errorHandler.js";
import { uploadChapterFiles, generatePresignedChapterUrl } from "../services/uploadService.js";
import { getPublicUrl as getR2PublicUrl, getObjectText } from "../services/r2UploadService.js";
import { convertDocBufferToHtml } from "../utils/convertDocToHtml.js";

const PRICE_DEFAULT = 10;
const ACCESS_EXPIRES_SECONDS = 900; // 15 minutes
const GIFT_MIN_COINS = 1;
const GIFT_MAX_COINS = 100000;

const ensureNovelExists = async (novelId) => {
  const novel = await Novel.findById(novelId).select("poster title");
  if (!novel) {
    throw new AppError("Truyện không tồn tại", 404);
  }
  return novel;
};

const ensurePosterPermission = (novel, userId, action = "thao tác") => {
  if (!userId || novel.poster.toString() !== userId) {
    throw new AppError(`Bạn không có quyền ${action} chapter cho truyện này`, 403);
  }
};

const parseChapterNumber = (value) => {
  if (value === undefined || value === null) return undefined;
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0) {
    throw new AppError("chapterNumber phải là số lớn hơn 0", 400);
  }
  return num;
};

const normalizePrice = (isLocked, priceInput) => {
  if (!isLocked) return 0;
  const price = priceInput ?? PRICE_DEFAULT;
  const num = Number(price);
  if (Number.isNaN(num) || num <= 0) {
    throw new AppError("Giá mở khóa không hợp lệ", 400);
  }
  return Math.round(num);
};

const parseBooleanFlag = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true" || value === "1") return true;
    if (value.toLowerCase() === "false" || value === "0") return false;
  }
  return Boolean(value);
};

const ensureGiftCoins = (coins) => {
  const parsed = Number(coins);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new AppError("Số xu không hợp lệ", 400);
  }
  if (parsed < GIFT_MIN_COINS) {
    throw new AppError(`Số xu tối thiểu là ${GIFT_MIN_COINS}`, 400);
  }
  if (parsed > GIFT_MAX_COINS) {
    throw new AppError(`Số xu tối đa cho mỗi lần tặng là ${GIFT_MAX_COINS.toLocaleString("vi-VN")}`, 400);
  }
  return parsed;
};

const fetchRequestUser = async (req, fields = "coins unlockedChapters readerSettings") => {
  if (!req.user?.userId) return null;
  if (req.currentUserDoc) return req.currentUserDoc;
  req.currentUserDoc = await User.findById(req.user.userId).select(fields);
  return req.currentUserDoc;
};

const hasUnlockedChapter = (chapterId, userDoc) => {
  if (!userDoc?.unlockedChapters) return false;
  return userDoc.unlockedChapters.some((id) => id.toString() === chapterId.toString());
};

const prepareUploadsIfNeeded = async ({ req, novelId, chapterNumber }) => {
  const manualContent = req.body?.content;
  if (!req.file && (manualContent === undefined || manualContent === null)) {
    return null;
  }

  if (!req.file && typeof manualContent !== "string") {
    throw new AppError("Nội dung chương phải là chuỗi", 400);
  }

  const rawBuffer = req.file ? req.file.buffer : Buffer.from(manualContent, "utf8");
  if (!rawBuffer || rawBuffer.length === 0) {
    throw new AppError("File chương rỗng", 400);
  }

  const originalName = req.file?.originalname || `chapter-${Date.now()}.txt`;
  const mimetype = req.file?.mimetype || "text/plain";
  const extension = originalName.includes(".")
    ? originalName.split(".").pop().toLowerCase()
    : req.file
    ? "bin"
    : "txt";

  const { html } = await convertDocBufferToHtml(rawBuffer, originalName, mimetype);
  const htmlBuffer = Buffer.from(html, "utf8");

  return uploadChapterFiles({
    novelId,
    chapterNumber,
    rawBuffer,
    rawMimeType: mimetype,
    rawExtension: extension,
    htmlBuffer,
  });
};

const sanitizeFileMeta = (fileMeta, { exposeUrl }) => {
  if (!fileMeta) return null;
  return {
    url: exposeUrl ? (fileMeta.key ? getR2PublicUrl(fileMeta.key) : fileMeta.url) : null,
    mimeType: fileMeta.mimeType,
    size: fileMeta.size,
  };
};

const buildChapterResponse = (chapter, { hasAccess }) => {
  const exposePublicUrl = !chapter.isLocked;
  return {
    _id: chapter._id,
    novel: chapter.novel,
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    isLocked: chapter.isLocked,
    priceXu: chapter.priceXu,
    createdAt: chapter.createdAt,
    updatedAt: chapter.updatedAt,
    legacyHasInlineContent: Boolean(chapter.content),
    files: {
      html: sanitizeFileMeta(chapter.htmlFile, { exposeUrl: exposePublicUrl }),
      raw: sanitizeFileMeta(chapter.rawFile, { exposeUrl: exposePublicUrl }),
    },
    access: {
      hasAccess: !chapter.isLocked || hasAccess,
      requiresPurchase: chapter.isLocked,
      priceXu: chapter.priceXu,
      publicHtmlUrl: !chapter.isLocked ? chapter.htmlFile?.url : null,
      publicRawUrl: !chapter.isLocked ? chapter.rawFile?.url : null,
    },
  };
};

const notifyBookmarkUsers = async ({ novelId, novelTitle, chapter }) => {
  // Notify users who have a readingProgress for this novel and have enabled notifications
  const subscribers = await ReadingProgress.find({ novel: novelId, notifyOnNewChapter: true }).populate('user', '_id');
  if (!subscribers.length) return;
  const userIds = subscribers.map((s) => s.user._id);
  const notificationMessage = `Truyện ${novelTitle} vừa có chương mới: ${chapter.title}`;
  const notifications = userIds.map((userId) => ({
    user: userId,
    title: "Chương mới",
    message: notificationMessage,
    type: "new_chapter",
    relatedNovel: novelId,
    relatedChapter: chapter._id,
  }));
  await Notification.insertMany(notifications);
};

// Tạo chapter mới
export const createChapter = async (req, res, next) => {
  try {
    const { novelId } = req.params;
    const chapterNumber = parseChapterNumber(req.body.chapterNumber);
    const { title } = req.body;
    if (!chapterNumber || !title) {
      return next(new AppError("chapterNumber và title là bắt buộc", 400));
    }

    const novel = await ensureNovelExists(novelId);
    const requester = await User.findById(req.user.userId).select("role");
    const isAdmin = requester?.role === "admin";
    if (!isAdmin) {
      ensurePosterPermission(novel, req.user.userId, "tạo");
    }

    const duplicate = await Chapter.findOne({ novel: novelId, chapterNumber });
    if (duplicate) {
      return next(new AppError("Chapter number đã tồn tại", 400));
    }

    const uploads = await prepareUploadsIfNeeded({ req, novelId, chapterNumber });
    if (!uploads) {
      return next(new AppError("Cần cung cấp file hoặc nội dung chương", 400));
    }

    const isLocked = parseBooleanFlag(req.body.isLocked, false);
    const priceXu = normalizePrice(isLocked, req.body.price ?? req.body.priceXu);

    const chapter = new Chapter({
      novel: novelId,
      chapterNumber,
      title,
      rawFile: uploads.rawFile,
      htmlFile: uploads.htmlFile,
      isLocked,
      priceXu,
    });

    await chapter.save();

    try {
      await notifyBookmarkUsers({ novelId, novelTitle: novel.title, chapter });
    } catch (notificationError) {
      console.error("Error creating notifications:", notificationError);
    }

    res.status(201).json({
      message: "Chapter đã được tạo thành công",
      chapter: buildChapterResponse(chapter, { hasAccess: !isLocked }),
    });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách chapter của một truyện
export const getChaptersByNovel = async (req, res, next) => {
  try {
    const { novelId } = req.params;
    const { sort = "asc" } = req.query;

    const sortOrder = sort === "desc" ? -1 : 1;

    const chapters = await Chapter.find({ novel: novelId })
      .sort({ chapterNumber: sortOrder })
      .select("chapterNumber title isLocked priceXu createdAt updatedAt");

    res.json({ chapters });
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết chapter
export const getChapterById = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const chapter = await Chapter.findById(chapterId).populate("novel", "title poster");
    if (!chapter) {
      return next(new AppError("Chapter không tồn tại", 404));
    }

    const userDoc = await fetchRequestUser(req, "unlockedChapters");
    const isPoster = req.user?.userId && chapter.novel.poster?.toString() === req.user.userId;
    const hasAccess = !chapter.isLocked || isPoster || hasUnlockedChapter(chapter._id, userDoc);

    res.json({ chapter: buildChapterResponse(chapter, { hasAccess }) });
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

    const novel = await ensureNovelExists(chapter.novel);
    const requester = await User.findById(req.user.userId).select("role");
    const isAdmin = requester?.role === "admin";
    if (!isAdmin) {
      ensurePosterPermission(novel, req.user.userId, "cập nhật");
    }

    const updatedFields = {};
    if (req.body.chapterNumber !== undefined) {
      const newNumber = parseChapterNumber(req.body.chapterNumber);
      if (newNumber !== chapter.chapterNumber) {
        const duplicate = await Chapter.findOne({ novel: chapter.novel, chapterNumber: newNumber });
        if (duplicate) {
          return next(new AppError("Chapter number đã tồn tại", 400));
        }
        updatedFields.chapterNumber = newNumber;
      }
    }
    if (req.body.title !== undefined) {
      updatedFields.title = req.body.title;
    }

    const uploads = await prepareUploadsIfNeeded({
      req,
      novelId: chapter.novel,
      chapterNumber: updatedFields.chapterNumber || chapter.chapterNumber,
    });

    if (uploads) {
      updatedFields.rawFile = uploads.rawFile;
      updatedFields.htmlFile = uploads.htmlFile;
      updatedFields.content = undefined; // clear legacy content
    }

    if (req.body.isLocked !== undefined) {
      updatedFields.isLocked = parseBooleanFlag(req.body.isLocked, chapter.isLocked);
    }

    // Determine the intended locked state for this update (either newly set or existing)
    const targetIsLocked = updatedFields.isLocked ?? chapter.isLocked;

    if (req.body.price !== undefined || req.body.priceXu !== undefined) {
      // Caller provided an explicit price -> validate/normalize
      updatedFields.priceXu = normalizePrice(
        targetIsLocked,
        req.body.price ?? req.body.priceXu
      );
    } else {
      // No explicit price provided: ensure sensible defaults
      if (targetIsLocked) {
        // If we're locking (or leaving locked) and there's already a positive price, keep it.
        // Otherwise set the default price so locked chapters don't end up with 0 xu.
        updatedFields.priceXu = chapter.priceXu && chapter.priceXu > 0 ? chapter.priceXu : PRICE_DEFAULT;
      } else {
        // Unlocking -> price must be 0
        updatedFields.priceXu = 0;
      }
    }

    Object.assign(chapter, updatedFields);
    await chapter.save();

    res.json({ message: "Chapter đã được cập nhật", chapter: buildChapterResponse(chapter, { hasAccess: !chapter.isLocked }) });
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

    const novel = await ensureNovelExists(chapter.novel);
    const requester = await User.findById(req.user.userId).select("role");
    const isAdmin = requester?.role === "admin";
    if (!isAdmin) {
      ensurePosterPermission(novel, req.user.userId, "xóa");
    }

    await Chapter.findByIdAndDelete(chapterId);

    if (isAdmin && novel?.poster) {
      const reason = (req.body?.reason || "").toString().trim();
      const reasonText = reason ? ` Lý do: ${reason}` : "";
      await Notification.create({
        user: novel.poster,
        title: "Chương bị xóa",
        message: `Chương: ${chapter.title || ""} do bạn tạo đã bị xóa bởi admin.${reasonText}`,
        type: "system",
        relatedNovel: chapter.novel,
        relatedChapter: chapter._id,
      });
    }
    res.json({ message: "Chapter đã được xóa" });
  } catch (error) {
    next(error);
  }
};

export const getChapterAccess = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const chapter = await Chapter.findById(chapterId).populate("novel", "poster");
    if (!chapter) {
      return next(new AppError("Chapter không tồn tại", 404));
    }

    if (!chapter.htmlFile?.key) {
      return next(new AppError("Chương chưa có nội dung để đọc", 400));
    }

    if (!chapter.isLocked) {
      // If R2/MinIO is not publicly readable, return a signed URL instead
      const publicReadable = process.env.R2_PUBLIC_READ === "true" || process.env.MINIO_PUBLIC_READ === "true";
      if (publicReadable) {
        // Optionally return inline HTML to avoid CORS issues when configured
        if (process.env.R2_RETURN_PUBLIC_HTML === "true") {
          try {
            const htmlText = await getObjectText(chapter.htmlFile.key);
            return res.json({ type: "public", html: htmlText, htmlUrl: chapter.htmlFile.url, rawUrl: chapter.rawFile?.url || null });
          } catch (err) {
            // If fetching inline fails, fall back to returning URL
            console.error('Failed to fetch public HTML for proxy:', err);
            return res.json({ type: "public", htmlUrl: chapter.htmlFile.url, rawUrl: chapter.rawFile?.url || null });
          }
        }

        return res.json({ type: "public", htmlUrl: chapter.htmlFile.url, rawUrl: chapter.rawFile?.url || null });
      }

      const [htmlUrl, rawUrl] = await Promise.all([
        generatePresignedChapterUrl(chapter.htmlFile.key, ACCESS_EXPIRES_SECONDS),
        chapter.rawFile?.key ? generatePresignedChapterUrl(chapter.rawFile.key, ACCESS_EXPIRES_SECONDS) : Promise.resolve(null),
      ]);

      return res.json({ type: "signed", htmlUrl, rawUrl, expiresIn: ACCESS_EXPIRES_SECONDS });
    }

    const userDoc = await fetchRequestUser(req, "unlockedChapters");
    const isPoster = req.user?.userId && chapter.novel.poster?.toString() === req.user.userId;
    const hasAccess = isPoster || hasUnlockedChapter(chapter._id, userDoc);
    if (!hasAccess) {
      return next(new AppError("Bạn chưa mua chương này", 402));
    }

    const [htmlUrl, rawUrl] = await Promise.all([
      generatePresignedChapterUrl(chapter.htmlFile.key, ACCESS_EXPIRES_SECONDS),
      chapter.rawFile?.key ? generatePresignedChapterUrl(chapter.rawFile.key, ACCESS_EXPIRES_SECONDS) : Promise.resolve(null),
    ]);

    res.json({ type: "signed", htmlUrl, rawUrl, expiresIn: ACCESS_EXPIRES_SECONDS });
  } catch (error) {
    next(error);
  }
};

export const giftChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const coins = ensureGiftCoins(req.body?.coins);

    const sender = await User.findById(req.user.userId).select("coins username");
    if (!sender) {
      return next(new AppError("Không có token", 401));
    }

    const chapter = await Chapter.findById(chapterId).populate("novel", "poster title");
    if (!chapter) {
      return next(new AppError("Chapter không tồn tại", 404));
    }

    const novelInfo = chapter.novel;
    const posterId = novelInfo?.poster;
    if (!posterId) {
      return next(new AppError("Không tìm thấy người đăng truyện", 404));
    }

    if (posterId.toString() === sender._id.toString()) {
      return next(new AppError("Bạn là chủ truyện, không thể tự tặng quà", 400));
    }

    if (sender.coins < coins) {
      return next(new AppError("Số xu không đủ", 400));
    }

    const receiver = await User.findById(posterId).select("coins username");
    if (!receiver) {
      return next(new AppError("Người đăng truyện không tồn tại", 404));
    }

    sender.coins -= coins;
    receiver.coins += coins;
    await Promise.all([sender.save(), receiver.save()]);

    const novelId = novelInfo?._id || chapter.novel;
    const amountLabel = coins.toLocaleString("vi-VN");
    const novelTitle = novelInfo?.title || "";

    await Transaction.create([
      {
        user: sender._id,
        type: "gift",
        direction: "debit",
        amount: coins,
        provider: "system",
        status: "success",
        chapter: chapter._id,
        novel: novelId,
        description: `Tặng ${amountLabel} xu cho truyện ${novelTitle}`,
        metadata: {
          fromUser: sender._id,
          toUser: receiver._id,
          fromUsername: sender.username,
          toUsername: receiver.username,
        },
      },
      {
        user: receiver._id,
        type: "gift",
        direction: "credit",
        amount: coins,
        provider: "system",
        status: "success",
        chapter: chapter._id,
        novel: novelId,
        description: `Nhận ${amountLabel} xu từ ${sender.username}`,
        metadata: {
          fromUser: sender._id,
          toUser: receiver._id,
          fromUsername: sender.username,
          toUsername: receiver.username,
        },
      },
    ]);

    await Notification.create({
      user: receiver._id,
      title: "Nhận quà",
      message: `${sender.username} đã tặng ${amountLabel} xu cho truyện ${novelTitle}.`,
      type: "gift",
      relatedNovel: novelId,
      relatedChapter: chapter._id,
    });

    res.json({ message: "Cảm ơn bạn đã tặng quà!", coins: sender.coins });
  } catch (error) {
    next(error);
  }
};

export const purchaseChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const userDoc = await fetchRequestUser(req, "coins unlockedChapters");
    if (!userDoc) {
      return next(new AppError("Không có token", 401));
    }

    const chapter = await Chapter.findById(chapterId).populate("novel", "poster title");
    if (!chapter) {
      return next(new AppError("Chapter không tồn tại", 404));
    }

    if (!chapter.isLocked) {
      return next(new AppError("Chapter này đã mở miễn phí", 400));
    }

    if (chapter.novel.poster?.toString() === userDoc._id.toString()) {
      return res.json({ message: "Bạn là chủ truyện, không cần mua", unlocked: true });
    }

    if (hasUnlockedChapter(chapter._id, userDoc)) {
      return res.json({ message: "Bạn đã mua chương này trước đó", unlocked: true });
    }

    const priceXu = chapter.priceXu || PRICE_DEFAULT;
    if (userDoc.coins < priceXu) {
      return next(new AppError("Số xu không đủ", 400));
    }

    const posterId = chapter.novel.poster;
    const posterDoc = await User.findById(posterId).select("coins username");
    if (!posterDoc) {
      return next(new AppError("Người đăng truyện không tồn tại", 404));
    }

    userDoc.coins -= priceXu;
    userDoc.unlockedChapters.push(chapter._id);
    posterDoc.coins += priceXu;
    await Promise.all([userDoc.save(), posterDoc.save()]);

    const novelId = chapter.novel._id || chapter.novel;
    const amountLabel = priceXu.toLocaleString("vi-VN");

    await Transaction.create([
      {
        user: userDoc._id,
        type: "purchase",
        direction: "debit",
        amount: priceXu,
        chapter: chapter._id,
        novel: novelId,
        status: "success",
        provider: "system",
        description: `Mua chương ${chapter.chapterNumber} — ${chapter.title}`,
        metadata: {
          fromUser: userDoc._id,
          toUser: posterDoc._id,
          fromUsername: userDoc.username,
          toUsername: posterDoc.username,
        },
      },
      {
        user: posterDoc._id,
        type: "purchase",
        direction: "credit",
        amount: priceXu,
        chapter: chapter._id,
        novel: novelId,
        status: "success",
        provider: "system",
        description: `Nhận ${amountLabel} xu từ ${userDoc.username}`,
        metadata: {
          fromUser: userDoc._id,
          toUser: posterDoc._id,
          fromUsername: userDoc.username,
          toUsername: posterDoc.username,
        },
      },
    ]);

    await Notification.create({
      user: posterDoc._id,
      title: "Nhận xu",
      message: `${userDoc.username} đã mở khóa chương ${chapter.chapterNumber} (${chapter.title}) và trả ${amountLabel} xu.`,
      type: "info",
      relatedNovel: novelId,
      relatedChapter: chapter._id,
    });

    res.json({ message: "Mua chương thành công", coins: userDoc.coins, unlocked: true });
  } catch (error) {
    next(error);
  }
};
