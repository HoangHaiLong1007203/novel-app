import mongoose from "mongoose";

const readingProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    novel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Novel",
      required: true,
    },
    // Array of chapter IDs that user has read
    readChapters: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
    }],
    // Total number of chapters read (for quick access)
    totalChaptersRead: {
      type: Number,
      default: 0,
    },
    // Percentage of novel completed (calculated field)
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
    // Timestamp when we last incremented the novel view for this user/novel
    lastViewIncrementAt: {
      type: Date,
    },
    // Track reading sessions
    readingSessions: [{
      chapter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chapter",
        required: true,
      },
      startedAt: {
        type: Date,
        required: true,
      },
      completedAt: {
        type: Date,
      },
      timeSpent: {
        type: Number, // in minutes
        default: 0,
      },
    }],
    // Whether the user wants to receive notifications for new chapters of this novel
    notifyOnNewChapter: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
readingProgressSchema.index({ user: 1, novel: 1 }, { unique: true });
readingProgressSchema.index({ novel: 1 });
readingProgressSchema.index({ user: 1 });

// Virtual to check if user can review (80% completion)
readingProgressSchema.virtual('canReview').get(function() {
  return this.completionPercentage >= 80;
});

// Method to add a read chapter
readingProgressSchema.methods.addReadChapter = function(chapterId, timeSpent = 0, sessionTimes = {}) {
  const chapterIdStr = chapterId.toString();
  const alreadyRead = this.readChapters.some(id => id.toString() === chapterIdStr);

  const startedAt = sessionTimes.startedAt instanceof Date
    ? sessionTimes.startedAt
    : sessionTimes.startedAt
      ? new Date(sessionTimes.startedAt)
      : new Date();
  const completedAt = sessionTimes.completedAt instanceof Date
    ? sessionTimes.completedAt
    : sessionTimes.completedAt
      ? new Date(sessionTimes.completedAt)
      : new Date();

  // Always record a reading session (so we can count every completed read)
  this.readingSessions.push({
    chapter: chapterId,
    startedAt,
    completedAt,
    timeSpent: timeSpent,
  });

  // Only add to readChapters the first time the chapter is read
  if (!alreadyRead) {
    this.readChapters.push(chapterId);
    this.totalChaptersRead = this.readChapters.length;
    this.lastReadAt = completedAt;
  } else {
    // update lastReadAt even for re-reads
    this.lastReadAt = completedAt;
  }

  return this;
};

// Method to calculate completion percentage
readingProgressSchema.methods.calculateCompletionPercentage = function(totalChapters) {
  if (totalChapters > 0) {
    const normalizedTotal = Math.max(0, totalChapters);
    const normalizedRead = Math.min(this.readChapters.length, normalizedTotal);
    this.totalChaptersRead = normalizedRead;
    const rawPercentage = Math.round((normalizedRead / normalizedTotal) * 100);
    this.completionPercentage = Math.min(100, Math.max(0, rawPercentage));
    return this.completionPercentage;
  }

  this.completionPercentage = 0;
  this.totalChaptersRead = 0;
  return this.completionPercentage;
};

// Static method to get or create reading progress
readingProgressSchema.statics.getOrCreate = async function(userId, novelId) {
  let progress = await this.findOne({ user: userId, novel: novelId });
  if (!progress) {
    progress = new this({ user: userId, novel: novelId });
    await progress.save();
  }
  return progress;
};

const ReadingProgress = mongoose.model("ReadingProgress", readingProgressSchema);
export default ReadingProgress;
