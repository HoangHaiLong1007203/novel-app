import fetch from 'node-fetch';
import axios from "axios";

const BASE_URL = 'http://localhost:5000/api';
const AUTH_BASE_URL = 'http://localhost:5000/api/auth';

// Test data
let accessToken = '';
let novelId = '';
let chapterId = '';
let userId = '';
let testEmail = `testuser_chapter_${Date.now()}@example.com`;

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

const testRegister = async () => {
  console.log('\n=== Test Register ===');
  try {
    const res = await axios.post(`${AUTH_BASE_URL}/register`, {
      username: "testuserchapter",
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

// Create a test novel for chapters
const testCreateNovel = async () => {
  console.log('\n=== Test Create Novel for Chapters ===');
  const { response, data } = await makeRequest(
    'POST',
    `${BASE_URL}/novels`,
    {
      title: 'Test Novel for Chapters',
      description: 'A test novel to hold chapters',
      genres: 'fantasy',
      type: 'sáng tác',
      status: 'còn tiếp',
    },
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.ok) {
    novelId = data.novel._id;
    console.log('✅ Novel created successfully:', data.novel.title, 'novelId:', novelId);
  } else {
    console.log('❌ Create novel failed:', data.error || data.message);
  }
};

// Test create chapter
const testCreateChapter = async () => {
  console.log('\n=== Test Create Chapter ===');
  const { response, data } = await makeRequest(
    'POST',
    `${BASE_URL}/novels/${novelId}/chapters`,
    {
      chapterNumber: 1,
      title: 'Chapter 1: Introduction',
      content: 'This is the content of chapter 1.',
      isLocked: false,
      price: 0,
    },
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.ok) {
    chapterId = data.chapter._id;
    console.log('✅ Chapter created successfully:', data.chapter.title);
  } else {
    console.log('❌ Create chapter failed:', data.error || data.message);
  }
};

// Test create another chapter
const testCreateChapter2 = async () => {
  console.log('\n=== Test Create Chapter 2 ===');
  const { response, data } = await makeRequest(
    'POST',
    `${BASE_URL}/novels/${novelId}/chapters`,
    {
      chapterNumber: 2,
      title: 'Chapter 2: Development',
      content: 'This is the content of chapter 2.',
      isLocked: true,
      price: 10,
    },
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.ok) {
    console.log('✅ Chapter 2 created successfully:', data.chapter.title);
  } else {
    console.log('❌ Create chapter 2 failed:', data.error || data.message);
  }
};

// Test get chapters by novel (default sort asc)
const testGetChapters = async () => {
  console.log('\n=== Test Get Chapters (ASC) ===');
  const { response, data } = await makeRequest('GET', `${BASE_URL}/novels/${novelId}/chapters`);

  if (response.ok) {
    console.log(`✅ Retrieved ${data.chapters.length} chapters`);
    data.chapters.forEach(chapter => {
      console.log(`- Chapter ${chapter.chapterNumber}: ${chapter.title}, locked: ${chapter.isLocked}, price: ${chapter.price}`);
    });
  } else {
    console.log('❌ Get chapters failed:', data.error || data.message);
  }
};

// Test get chapters sorted desc
const testGetChaptersDesc = async () => {
  console.log('\n=== Test Get Chapters (DESC) ===');
  const { response, data } = await makeRequest('GET', `${BASE_URL}/novels/${novelId}/chapters?sort=desc`);

  if (response.ok) {
    console.log(`✅ Retrieved ${data.chapters.length} chapters (desc)`);
    data.chapters.forEach(chapter => {
      console.log(`- Chapter ${chapter.chapterNumber}: ${chapter.title}`);
    });
  } else {
    console.log('❌ Get chapters desc failed:', data.error || data.message);
  }
};

// Test get chapter by ID
const testGetChapterById = async () => {
  console.log('\n=== Test Get Chapter By ID ===');
  const { response, data } = await makeRequest('GET', `${BASE_URL}/novels/${novelId}/chapters/${chapterId}`);

  if (response.ok) {
    console.log('✅ Chapter details retrieved:', data.chapter.title);
    console.log('Content:', data.chapter.content.substring(0, 50) + '...');
  } else {
    console.log('❌ Get chapter by ID failed:', data.error || data.message);
  }
};

// Test update chapter
const testUpdateChapter = async () => {
  console.log('\n=== Test Update Chapter ===');
  const { response, data } = await makeRequest(
    'PUT',
    `${BASE_URL}/novels/${novelId}/chapters/${chapterId}`,
    {
      title: 'Updated Chapter 1',
      content: 'Updated content for chapter 1.',
      isLocked: true,
      price: 5,
    },
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.ok) {
    console.log('✅ Chapter updated successfully:', data.chapter.title);
  } else {
    console.log('❌ Update chapter failed:', data.error || data.message);
  }
};

// Test delete chapter
const testDeleteChapter = async () => {
  console.log('\n=== Test Delete Chapter ===');
  const { response, data } = await makeRequest(
    'DELETE',
    `${BASE_URL}/novels/${novelId}/chapters/${chapterId}`,
    null,
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.ok) {
    console.log('✅ Chapter deleted successfully');
  } else {
    console.log('❌ Delete chapter failed:', data.error || data.message);
  }
};

// Test unauthorized create chapter
const testUnauthorizedCreate = async () => {
  console.log('\n=== Test Unauthorized Create Chapter ===');
  const { response, data } = await makeRequest(
    'POST',
    `${BASE_URL}/novels/${novelId}/chapters`,
    {
      chapterNumber: 3,
      title: 'Unauthorized Chapter',
      content: 'This should fail.',
    }
  );

  if (response.status === 401) {
    console.log('✅ Unauthorized create properly blocked');
  } else {
    console.log('❌ Unauthorized create not blocked:', response.status);
  }
};

// Test invalid novel ID
const testInvalidNovelId = async () => {
  console.log('\n=== Test Invalid Novel ID ===');
  const { response, data } = await makeRequest(
    'GET',
    `${BASE_URL}/novels/invalidId/chapters`,
    null,
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.status === 400 || response.status === 404 || response.status === 500) {
    console.log('✅ Invalid novel ID handled');
  } else {
    console.log('❌ Invalid novel ID not handled:', response.status);
  }
};

// Test non-existent chapter ID
const testNonExistentChapter = async () => {
  console.log('\n=== Test Non-existent Chapter ID ===');
  const { response, data } = await makeRequest(
    'GET',
    `${BASE_URL}/novels/${novelId}/chapters/507f1f77bcf86cd799439011`,
    null,
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.status === 404) {
    console.log('✅ Non-existent chapter handled');
  } else {
    console.log('❌ Non-existent chapter not handled:', response.status);
  }
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting Chapter API Tests...');

  await testRegister();
  await testLogin();
  if (!accessToken) {
    console.log('❌ Cannot proceed without login token');
    return;
  }

  await testCreateNovel();
  if (!novelId) {
    console.log('❌ Cannot proceed without novel ID');
    return;
  }

  await testCreateChapter();
  await testCreateChapter2();
  await testGetChapters();
  await testGetChaptersDesc();
  await testGetChapterById();
  await testUpdateChapter();
  await testUnauthorizedCreate();
  await testInvalidNovelId();
  await testNonExistentChapter();
  await testDeleteChapter();

  console.log('\n🎉 All chapter tests completed!');
};

runTests().catch(console.error);
