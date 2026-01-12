import { describe, it, beforeAll, afterAll, expect } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { purchaseChapter } from "../controllers/chapterController.js";
import User from "../models/User.js";
import Novel from "../models/Novel.js";
import Chapter from "../models/Chapter.js";
import Transaction from "../models/Transaction.js";

let mongo;

const createResponse = () => {
  const payload = { body: null };
  return {
    json(data) {
      payload.body = data;
      return data;
    },
    get body() {
      return payload.body;
    },
  };
};

describe("purchaseChapter controller", () => {
  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(mongo.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });

  it("deducts coins and creates a transaction", async () => {
    const user = await User.create({ username: "buyer", email: "buyer@example.com", coins: 50 });
    const poster = await User.create({ username: "poster", email: "poster@example.com" });
    const novel = await Novel.create({
      title: "Test novel",
      author: "Tester",
      poster: poster._id,
      type: "sáng tác",
    });
    const chapter = await Chapter.create({
      novel: novel._id,
      chapterNumber: 1,
      title: "Locked",
      isLocked: true,
      priceXu: 10,
    });

    const req = { params: { chapterId: chapter._id.toString() }, user: { userId: user._id.toString() } };
    const res = createResponse();
    const next = (err) => {
      throw err ?? new Error("next called");
    };

    await purchaseChapter(req, res, next);
    const refreshedUser = await User.findById(user._id);

    expect(res.body?.message).toMatch(/thành công/i);
    expect(refreshedUser?.coins).toBe(40);
    const transactionCount = await Transaction.countDocuments({ user: user._id, chapter: chapter._id });
    expect(transactionCount).toBe(1);
  });
});
