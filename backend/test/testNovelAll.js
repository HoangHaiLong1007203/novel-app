import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

const BASE = process.env.BASE_URL || 'https://localhost:5000';
const BASE_URL = `${BASE}/api`;
const AUTH_BASE_URL = `${BASE}/api/auth`;

// Test data
let accessToken = '';
let novelId = '';
let userId = '';
let testEmail = `testuser_${Date.now()}@example.com`;

// Helper function to make requests
const makeRequest = async (method, url, body = null, headers = {}) => {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(url, config);
  const data = await response.json();
  return { response, data };
};

import axios from "axios";

const testRegister = async () => {
  console.log('\n=== Test Register ===');
  try {
    const res = await axios.post(`${AUTH_BASE_URL}/register`, {
      username: "testuser",
      email: testEmail,
      password: "123456",
    });
    console.log("✅ Registration successful", res.data);
  } catch (err) {
    console.log("❌ Registration failed:", err.response?.data || err.message);
  }
};

const testLogin = async () => {
  console.log('\n=== Test Login ===');
  try {
    const res = await axios.post(`${AUTH_BASE_URL}/login`, {
      email: testEmail,
      password: "123456",
    });
    console.log("✅ Login successful", res.data);
    accessToken = res.data.accessToken;
    userId = res.data.userId || (res.data.user && res.data.user.id);
  } catch (err) {
    console.log("❌ Login failed:", err.response?.data || err.message);
  }
};

// Test create novel without cover
const testCreateNovelNoCover = async () => {
  console.log('\n=== Test Create Novel (No Cover) ===');
  const { response, data } = await makeRequest(
    'POST',
    `${BASE_URL}/novels`,
    {
      title: 'Test Novel No Cover',
      description: 'A test novel without cover',
      genres: 'fantasy,adventure',
      type: 'sáng tác',
      status: 'còn tiếp',
    },
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.ok) {
    novelId = data.novel._id;
    console.log('✅ Novel created successfully:', data.novel.title);
    console.log('Cover URL:', data.novel.coverImageUrl);
  } else {
    console.log('❌ Create novel failed:', data.error || data.message);
  }
};

// Test create novel with cover
const testCreateNovelWithCover = async () => {
  console.log('\n=== Test Create Novel (With Cover) ===');

  // Create a dummy image file for testing
  const formData = new FormData();
  formData.append('title', 'Test Novel With Cover');
  formData.append('description', 'A test novel with cover');
  formData.append('genres', 'romance,drama');
  formData.append('type', 'sáng tác');
  formData.append('status', 'còn tiếp');

  // Create a small dummy image buffer
  const dummyImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  formData.append('cover', dummyImageBuffer, { filename: 'test-cover.png', contentType: 'image/png' });

  const response = await fetch(`${BASE_URL}/novels`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  const data = await response.json();

  if (response.ok) {
    console.log('✅ Novel with cover created successfully:', data.novel.title);
    console.log('Cover URL:', data.novel.coverImageUrl);
  } else {
    console.log('❌ Create novel with cover failed:', data.error || data.message);
  }
};

// Test get novels
const testGetNovels = async () => {
  console.log('\n=== Test Get Novels ===');
  const { response, data } = await makeRequest('GET', `${BASE_URL}/novels`);

  if (response.ok) {
    console.log(`✅ Retrieved ${data.novels.length} novels`);
    data.novels.forEach(novel => {
      console.log(`- ${novel.title} by ${novel.author.username}, status: ${novel.status}, cover: ${novel.coverImageUrl}`);
      console.log('Full novel info:', novel);
    });
  } else {
    console.log('❌ Get novels failed:', data.error || data.message);
  }
};

// Test get novel by ID
const testGetNovelById = async () => {
  console.log('\n=== Test Get Novel By ID ===');
  const { response, data } = await makeRequest('GET', `${BASE_URL}/novels/${novelId}`);

  if (response.ok) {
    console.log('✅ Novel details retrieved:', data.novel.title);
    console.log('Cover URL:', data.novel.coverImageUrl);
    console.log('Full novel info:', data.novel);
  } else {
    console.log('❌ Get novel by ID failed:', data.error || data.message);
  }
};

// Test update novel
const testUpdateNovel = async () => {
  console.log('\n=== Test Update Novel ===');
  const { response, data } = await makeRequest(
    'PUT',
    `${BASE_URL}/novels/${novelId}`,
    {
      title: 'Updated Test Novel',
      description: 'Updated description',
      status: 'hoàn thành',
    },
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.ok) {
    console.log('✅ Novel updated successfully:', data.novel.title);
  } else {
    console.log('❌ Update novel failed:', data.error || data.message);
  }
};

// Test update cover image
const testUpdateCover = async () => {
  console.log('\n=== Test Update Cover Image ===');

  const formData = new FormData();
  const dummyImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  formData.append('cover', dummyImageBuffer, { filename: 'updated-cover.png', contentType: 'image/png' });

  const response = await fetch(`${BASE_URL}/novels/${novelId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...formData.getHeaders(),
    },
    body: formData,
  });

  const data = await response.json();

  if (response.ok) {
    console.log('✅ Cover updated successfully');
    console.log('New cover URL:', data.novel.coverImageUrl);
  } else {
    console.log('❌ Update cover failed:', data.error || data.message);
  }
};

// Test delete novel
const testDeleteNovel = async () => {
  console.log('\n=== Test Delete Novel ===');
  const { response, data } = await makeRequest(
    'DELETE',
    `${BASE_URL}/novels/${novelId}`,
    null,
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.ok) {
    console.log('✅ Novel deleted successfully');
  } else {
    console.log('❌ Delete novel failed:', data.error || data.message);
  }
};

// Test unauthorized access
const testUnauthorized = async () => {
  console.log('\n=== Test Unauthorized Access ===');
  const { response, data } = await makeRequest('POST', `${BASE_URL}/novels`, {
    title: 'Unauthorized Novel',
    type: 'sáng tác',
  });

  if (response.status === 401) {
    console.log('✅ Unauthorized access properly blocked');
  } else {
    console.log('❌ Unauthorized access not blocked:', response.status);
  }
};

// Test invalid type
const testInvalidType = async () => {
  console.log('\n=== Test Invalid Type ===');
  const { response, data } = await makeRequest(
    'POST',
    `${BASE_URL}/novels`,
    {
      title: 'Invalid Type Novel',
      type: 'invalid',
    },
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.status === 400) {
    console.log('✅ Invalid type properly rejected');
  } else {
    console.log('❌ Invalid type not rejected:', response.status);
  }
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting Novel API Tests...');

  await testRegister();
  await testLogin();
  if (!accessToken) {
    console.log('❌ Cannot proceed without login token');
    return;
  }

  await testCreateNovelNoCover();
  await testCreateNovelWithCover();
  await testGetNovels();
  await testGetNovelById();
  await testUpdateNovel();
  await testUpdateCover();
  await testUnauthorized();
  await testInvalidType();
  await testDeleteNovel();

  console.log('\n🎉 All tests completed!');
};

runTests().catch(console.error);
