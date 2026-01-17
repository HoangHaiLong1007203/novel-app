import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const BASE = process.env.BASE_URL || 'https://localhost:5000';
const BASE_URL = `${BASE}/api`;
const AUTH_BASE_URL = `${BASE}/api/auth`;
const REVIEW_BASE_URL = `${BASE}/api/reviews`;

let accessToken = '';
let userId = '';
let testEmail = `testuser_${Date.now()}@example.com`;
let novelId = '';
let reviewId = '';

const makeAuthRequest = async (method, url, body = null) => {
  const config = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  };

  if (body) {
    config.data = body;
  }

  const response = await axios(config);
  return response;
};

const setupUser = async () => {
  console.log('Setting up user...');
  try {
    await axios.post(`${AUTH_BASE_URL}/register`, {
      username: "testuser1",
      email: testEmail,
      password: "123456",
    });

    const loginRes = await axios.post(`${AUTH_BASE_URL}/login`, {
      email: testEmail,
      password: "123456",
    });

    accessToken = loginRes.data.accessToken;
    console.log('✅ User setup completed');
  } catch (err) {
    console.log('❌ User setup failed:', err.response?.data || err.message);
  }
};

const testReply = async () => {
  console.log('Testing reply functionality...');

  if (!accessToken) {
    console.log('❌ No access token, cannot test reply');
    return;
  }

  try {
    // First create a simple review to reply to
    const reviewRes = await makeAuthRequest('POST', `${REVIEW_BASE_URL}`, {
      novelId: '507f1f77bcf86cd799439011', // Dummy novel ID
      rating: 5,
      content: 'Test review for reply'
    });

    reviewId = reviewRes.data.review._id;
    console.log('✅ Review created:', reviewId);

    // Now try to reply
    const replyRes = await makeAuthRequest('POST', `${REVIEW_BASE_URL}/${reviewId}/reply`, {
      content: 'This is a reply to the review'
    });

    console.log('✅ Reply created successfully');
    console.log('Reply:', replyRes.data.reply);

  } catch (err) {
    console.log('❌ Reply failed:', err.response?.data || err.message);
    console.log('Full error:', err);
  }
};

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    await setupUser();
    await testReply();

    console.log('✅ Test completed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log("✅ MongoDB disconnected");
  }
};

runTest().catch(console.error);
