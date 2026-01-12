import mongoose from "mongoose";

const fileMetadataSchema = new mongoose.Schema(
  {
    url: { type: String },
    key: { type: String },
    mimeType: { type: String },
    size: { type: Number },
  },
  { _id: false }
);

const chapterSchema = new mongoose.Schema(
  {
    novel: { type: mongoose.Schema.Types.ObjectId, ref: "Novel", required: true },
    chapterNumber: { type: Number, required: true },
    title: { type: String, required: true },
    content: { type: String }, // legacy field for older chapters
    rawFile: fileMetadataSchema,
    htmlFile: fileMetadataSchema,
    isLocked: { type: Boolean, default: false },
    priceXu: { type: Number, default: 10, min: 0 },
  },
  { timestamps: true }
);

chapterSchema.index({ novel: 1, chapterNumber: 1 }, { unique: true });

chapterSchema.virtual("price")
  .get(function () {
    return this.priceXu;
  })
  .set(function (value) {
    this.priceXu = value;
  });

chapterSchema.set("toJSON", { virtuals: true });
chapterSchema.set("toObject", { virtuals: true });

export default mongoose.model("Chapter", chapterSchema);
