import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

function parseArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

const username = parseArg("username") || "admin";
const email = parseArg("email") || "admin@example.com";
const password = parseArg("password") || "changeme";

const SALT_ROUNDS = 10;

async function run() {
  await connectDB();

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  let user = null;

  if (email) {
    user = await User.findOne({ email });
  } else {
    user = await User.findOne({ username });
  }

  if (user) {
    user.role = "admin";
    user.username = username;
    if (password) user.password = hashed;
    if (!user.providers || user.providers.length === 0) user.providers = [{ name: "local" }];
    await user.save();
    console.log(`Updated existing user to admin: ${user._id}`);
  } else {
    const newUser = new User({
      username,
      email,
      password: hashed,
      role: "admin",
      providers: [{ name: "local" }],
    });
    await newUser.save();
    console.log(`Created new admin user: ${newUser._id}`);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error("Error creating admin:", err);
  process.exit(1);
});
