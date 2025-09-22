import Comment from "../models/Comment.js";
import Novel from "../models/Novel.js";
import Chapter from "../models/Chapter.js";
import AppError from "../middlewares/errorHandler.js";

// Create a new comment
export const createComment = async (req, res, next) => {
  try {
    const { novelId, chapterId, content } = req.body;
    const userId = req.user.userId;

    if (!novelId || !chapterId || !content) {
      return next(new AppError("Novel ID, Chapter ID và content là bắt buộc", 400));
    }

    // Verify novel exists
    const novel = await Novel.findById(novelId);
    if (!novel) {
      return next(new AppError("Truyện không tồn tại", 404));
    }

    // Verify chapter exists and belongs to the novel
    const chapter = await Chapter.findById(chapterId);
    if (!chapter || chapter.novel.toString() !== novelId) {
      return next(new AppError("Chương không tồn tại hoặc không thuộc truyện này", 404));
    }

    const comment = new Comment({
      novel: novelId,
      chapter: chapterId,
      user: userId,
      content: content.trim(),
    });

    await comment.save();

    // Update novel's comment count
    await Novel.findByIdAndUpdate(novelId, { $inc: { commentsCount: 1 } });

    // Populate user info for response
    await comment.populate('user', 'username avatarUrl');

    res.status(201).json({
      message: "Bình luận đã được tạo thành công",
      comment
    });
  } catch (error) {
    next(error);
  }
};

// Get comments by novel with pagination and sorting
export const getCommentsByNovel = async (req, res, next) => {
  try {
    const { novelId } = req.params;
    const { page = 1, limit = 10, sort = 'newest', chapterId } = req.query;
    const userId = req.user?.userId; // Optional for checking likes

    if (!novelId) {
      return next(new AppError("Novel ID là bắt buộc", 400));
    }

    // Verify novel exists
    const novel = await Novel.findById(novelId);
    if (!novel) {
      return next(new AppError("Truyện không tồn tại", 404));
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    let filter = { novel: novelId, isDeleted: false };
    if (chapterId) {
      filter.chapter = chapterId;
    }

    // Build sort
    let sortOption = {};
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else {
      sortOption = { createdAt: -1 }; // newest first
    }

    const comments = await Comment.find(filter)
      .populate('user', 'username avatarUrl')
      .populate('chapter', 'chapterNumber title')
      .populate({
        path: 'parentComment',
        populate: {
          path: 'user',
          select: 'username avatarUrl'
        }
      })
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    // Add like status for current user
    const commentsWithLikeStatus = comments.map(comment => {
      const commentObj = comment.toObject();
      if (userId) {
        commentObj.isLikedByUser = comment.isLikedByUser(userId);
      }
      return commentObj;
    });

    const totalComments = await Comment.countDocuments(filter);
    const totalPages = Math.ceil(totalComments / limitNum);

    res.json({
      comments: commentsWithLikeStatus,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalComments,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

// Reply to a comment
export const replyToComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return next(new AppError("Content là bắt buộc", 400));
    }

    // Find parent comment
    const parentComment = await Comment.findById(commentId);
    if (!parentComment || parentComment.isDeleted) {
      return next(new AppError("Bình luận gốc không tồn tại", 404));
    }

    // Verify user has access to the novel
    const novel = await Novel.findById(parentComment.novel);
    if (!novel) {
      return next(new AppError("Truyện không tồn tại", 404));
    }

    const reply = new Comment({
      novel: parentComment.novel,
      chapter: parentComment.chapter,
      user: userId,
      content: content.trim(),
      parentComment: commentId,
    });

    await reply.save();

    // Update novel's comment count
    await Novel.findByIdAndUpdate(parentComment.novel, { $inc: { commentsCount: 1 } });

    // Populate user info for response
    await reply.populate('user', 'username avatarUrl');

    res.status(201).json({
      message: "Phản hồi đã được tạo thành công",
      comment: reply
    });
  } catch (error) {
    next(error);
  }
};

// Like/unlike a comment
export const likeComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return next(new AppError("Bình luận không tồn tại", 404));
    }

    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      // Unlike
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    } else {
      // Like
      comment.likes.push(userId);
    }

    await comment.save();

    res.json({
      message: isLiked ? "Đã bỏ thích bình luận" : "Đã thích bình luận",
      likesCount: comment.likes.length,
      isLiked: !isLiked
    });
  } catch (error) {
    next(error);
  }
};

// Update own comment
export const updateComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return next(new AppError("Content là bắt buộc", 400));
    }

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return next(new AppError("Bình luận không tồn tại", 404));
    }

    if (comment.user.toString() !== userId) {
      return next(new AppError("Bạn không có quyền chỉnh sửa bình luận này", 403));
    }

    comment.content = content.trim();
    comment.editCount += 1;
    comment.lastEditedAt = new Date();

    await comment.save();

    res.json({
      message: "Bình luận đã được cập nhật",
      comment
    });
  } catch (error) {
    next(error);
  }
};

// Delete own comment (soft delete)
export const deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      return next(new AppError("Bình luận không tồn tại", 404));
    }

    if (comment.user.toString() !== userId) {
      return next(new AppError("Bạn không có quyền xóa bình luận này", 403));
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await comment.save();

    // Update novel's comment count
    await Novel.findByIdAndUpdate(comment.novel, { $inc: { commentsCount: -1 } });

    res.json({
      message: "Bình luận đã được xóa"
    });
  } catch (error) {
    next(error);
  }
};
