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
readingProgressSchema.methods.addReadChapter = function(chapterId, timeSpent = 0) {
  if (!this.readChapters.includes(chapterId)) {
    this.readChapters.push(chapterId);
    this.totalChaptersRead = this.readChapters.length;
    this.lastReadAt = new Date();

    // Add reading session
    this.readingSessions.push({
      chapter: chapterId,
      startedAt: new Date(),
      completedAt: new Date(),
      timeSpent: timeSpent,
    });
  }
  return this;
};

// Method to calculate completion percentage
readingProgressSchema.methods.calculateCompletionPercentage = function(totalChapters) {
  if (totalChapters > 0) {
    this.completionPercentage = Math.round((this.totalChaptersRead / totalChapters) * 100);
  }
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
