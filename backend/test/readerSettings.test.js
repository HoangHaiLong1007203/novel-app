import { describe, it, beforeAll, afterAll, expect } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User.js";
import { getReaderSettings, updateReaderSettings } from "../services/authService.js";

let mongo;

describe("Reader settings service", () => {
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

  it("sanitizes and persists reader settings", async () => {
    const user = await User.create({ username: "tester", email: "tester@example.com" });
    const settings = await updateReaderSettings(user._id, {
      fontSize: 40,
      lineHeight: 3,
      theme: "dark",
      backgroundColor: "#123abc",
      fontFamily: "Literata",
    });

    expect(settings.fontSize).toBeLessThanOrEqual(28);
    expect(settings.lineHeight).toBeLessThanOrEqual(2.4);
    expect(settings.theme).toBe("dark");

    const persisted = await getReaderSettings(user._id);
    expect(persisted.backgroundColor).toBe("#123abc");
    expect(persisted.fontFamily).toBe("Literata");
  });
});
