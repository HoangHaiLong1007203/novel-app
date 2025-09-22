import fetch from 'node-fetch';
import axios from "axios";

const BASE_URL = 'http://localhost:5000/api';
const AUTH_BASE_URL = 'http://localhost:5000/api/auth';

// Test data
let accessToken = '';
let userId = '';
let testEmail = `testuser_${Date.now()}@example.com`;
let novelId = '';
let chapterId = '';
let commentId = '';
let replyId = '';

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

// Setup: Register and login user
const setupUser = async () => {
  console.log('\n=== Setup User ===');
  try {
    // Register
    const registerRes = await axios.post(`${AUTH_BASE_URL}/register`, {
      username: "testuser",
      email: testEmail,
      password: "123456",
    });
    console.log("✅ Registration successful");

    // Login
    const loginRes = await axios.post(`${AUTH_BASE_URL}/login`, {
      email: testEmail,
      password: "123456",
    });
    console.log("✅ Login successful");
    accessToken = loginRes.data.accessToken;
    userId = loginRes.data.userId || (loginRes.data.user && loginRes.data.user.id);
  } catch (err) {
    console.log("❌ Setup failed:", err.response?.data || err.message);
    throw err;
  }
};

// Setup: Create a test novel and chapter
const setupNovelAndChapter = async () => {
  console.log('\n=== Setup Novel and Chapter ===');
  try {
    // Create novel
    const { response, data } = await makeRequest(
      'POST',
      `${BASE_URL}/novels`,
      {
        title: 'Test Novel for Comments',
        description: 'A test novel for comment testing',
        genres: 'fantasy,adventure',
        type: 'sáng tác',
        status: 'còn tiếp',
      },
      { Authorization: `Bearer ${accessToken}` }
    );

    if (!response.ok) {
      throw new Error('Failed to create novel');
    }
    novelId = data.novel._id;
    console.log('✅ Novel created:', data.novel.title);

    // Create chapter
    const chapterResponse = await makeRequest(
      'POST',
      `${BASE_URL}/novels/${novelId}/chapters`,
      {
        chapterNumber: 1,
        title: 'Test Chapter 1',
        content: 'This is test chapter content for comment testing.',
      },
      { Authorization: `Bearer ${accessToken}` }
    );

    if (!chapterResponse.response.ok) {
      throw new Error('Failed to create chapter');
    }
    chapterId = chapterResponse.data.chapter._id;
    console.log('✅ Chapter created:', chapterResponse.data.chapter.title);
  } catch (err) {
    console.log("❌ Setup novel/chapter failed:", err.message);
    throw err;
  }
};

// Test create comment
const testCreateComment = async () => {
  console.log('\n=== Test Create Comment ===');
  const { response, data } = await makeRequest(
    'POST',
    `${BASE_URL}/comments`,
    {
      novelId: novelId,
      chapterId: chapterId,
      content: 'This is a test comment for the novel.',
    },
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.ok) {
    commentId = data.comment._id;
    console.log('✅ Comment created successfully');
    console.log('Comment content:', data.comment.content);
    console.log('Chapter:', data.comment.chapter.chapterNumber);
  } else {
    console.log('❌ Create comment failed:', data.error || data.message);
  }
};

// Test get comments by novel
const testGetCommentsByNovel = async () => {
  console.log('\n=== Test Get Comments By Novel ===');
  const { response, data } = await makeRequest('GET', `${BASE_URL}/comments/novel/${novelId}`);

  if (response.ok) {
    console.log(`✅ Retrieved ${data.comments.length} comments`);
    data.comments.forEach(comment => {
      console.log(`- Comment: "${comment.content}" by ${comment.user.username}`);
      console.log(`  Chapter: ${comment.chapter.chapterNumber}, Likes: ${comment.likes.length}`);
    });
  } else {
    console.log('❌ Get comments failed:', data.error || data.message);
  }
};

// Test get comments with sorting
const testGetCommentsWithSorting = async () => {
  console.log('\n=== Test Get Comments With Sorting ===');

  // Test newest first (default)
  const { response: newestResponse, data: newestData } = await makeRequest(
    'GET',
    `${BASE_URL}/comments/novel/${novelId}?sort=newest`
  );

  if (newestResponse.ok) {
    console.log('✅ Comments sorted by newest first:', newestData.comments.length, 'comments');
  }

  // Test oldest first
  const { response: oldestResponse, data: oldestData } = await makeRequest(
    'GET',
    `${BASE_URL}/comments/novel/${novelId}?sort=oldest`
  );

  if (oldestResponse.ok) {
    console.log('✅ Comments sorted by oldest first:', oldestData.comments.length, 'comments');
  }
};

// Test get comments with pagination
const testGetCommentsWithPagination = async () => {
  console.log('\n=== Test Get Comments With Pagination ===');
  const { response, data } = await makeRequest(
    'GET',
    `${BASE_URL}/comments/novel/${novelId}?page=1&limit=5`
  );

  if (response.ok) {
    console.log('✅ Pagination test successful');
    console.log(`Page ${data.pagination.currentPage}/${data.pagination.totalPages}`);
    console.log(`Total comments: ${data.pagination.totalComments}`);
  } else {
    console.log('❌ Pagination test failed:', data.error || data.message);
  }
};

// Test reply to comment
const testReplyToComment = async () => {
  console.log('\n=== Test Reply To Comment ===');
  const { response, data } = await makeRequest(
    'POST',
    `${BASE_URL}/comments/${commentId}/reply`,
    {
      content: 'This is a reply to the test comment.',
    },
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.ok) {
    replyId = data.comment._id;
    console.log('✅ Reply created successfully');
    console.log('Reply content:', data.comment.content);
  } else {
    console.log('❌ Reply failed:', data.error || data.message);
  }
};

// Test like comment
const testLikeComment = async () => {
  console.log('\n=== Test Like Comment ===');
  const { response, data } = await makeRequest(
    'POST',
    `${BASE_URL}/comments/${commentId}/like`,
    {},
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.ok) {
    console.log('✅ Comment liked successfully');
    console.log(`Likes count: ${data.likesCount}, Is liked: ${data.isLiked}`);
  } else {
    console.log('❌ Like comment failed:', data.error || data.message);
  }
};

// Test unlike comment
const testUnlikeComment = async () => {
  console.log('\n=== Test Unlike Comment ===');
  const { response, data } = await makeRequest(
    'POST',
    `${BASE_URL}/comments/${commentId}/like`,
    {},
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.ok) {
    console.log('✅ Comment unliked successfully');
    console.log(`Likes count: ${data.likesCount}, Is liked: ${data.isLiked}`);
  } else {
    console.log('❌ Unlike comment failed:', data.error || data.message);
  }
};

// Test update comment
const testUpdateComment = async () => {
  console.log('\n=== Test Update Comment ===');
  const { response, data } = await makeRequest(
    'PUT',
    `${BASE_URL}/comments/${commentId}`,
    {
      content: 'This is an updated test comment.',
    },
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.ok) {
    console.log('✅ Comment updated successfully');
    console.log('Updated content:', data.comment.content);
    console.log('Edit count:', data.comment.editCount);
  } else {
    console.log('❌ Update comment failed:', data.error || data.message);
  }
};

// Test delete comment
const testDeleteComment = async () => {
  console.log('\n=== Test Delete Comment ===');
  const { response, data } = await makeRequest(
    'DELETE',
    `${BASE_URL}/comments/${commentId}`,
    null,
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.ok) {
    console.log('✅ Comment deleted successfully');
  } else {
    console.log('❌ Delete comment failed:', data.error || data.message);
  }
};

// Test unauthorized access
const testUnauthorizedAccess = async () => {
  console.log('\n=== Test Unauthorized Access ===');
  const { response, data } = await makeRequest('POST', `${BASE_URL}/comments`, {
    novelId: novelId,
    chapterId: chapterId,
    content: 'Unauthorized comment',
  });

  if (response.status === 401) {
    console.log('✅ Unauthorized access properly blocked');
  } else {
    console.log('❌ Unauthorized access not blocked:', response.status);
  }
};

// Test invalid data
const testInvalidData = async () => {
  console.log('\n=== Test Invalid Data ===');

  // Test missing required fields
  const { response, data } = await makeRequest(
    'POST',
    `${BASE_URL}/comments`,
    {
      content: 'Missing novel and chapter ID',
    },
    { Authorization: `Bearer ${accessToken}` }
  );

  if (response.status === 400) {
    console.log('✅ Invalid data properly rejected');
  } else {
    console.log('❌ Invalid data not rejected:', response.status);
  }
};

// Test get comments for non-existent novel
const testNonExistentNovel = async () => {
  console.log('\n=== Test Non-existent Novel ===');
  const { response, data } = await makeRequest('GET', `${BASE_URL}/comments/novel/507f1f77bcf86cd799439011`);

  if (response.status === 404) {
    console.log('✅ Non-existent novel properly handled');
  } else {
    console.log('❌ Non-existent novel not handled correctly:', response.status);
  }
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting Comment API Tests...');

  try {
    await setupUser();
    if (!accessToken) {
      console.log('❌ Cannot proceed without login token');
      return;
    }

    await setupNovelAndChapter();
    if (!novelId || !chapterId) {
      console.log('❌ Cannot proceed without novel and chapter');
      return;
    }

    await testCreateComment();
    await testGetCommentsByNovel();
    await testGetCommentsWithSorting();
    await testGetCommentsWithPagination();
    await testReplyToComment();
    await testLikeComment();
    await testUnlikeComment();
    await testUpdateComment();
    await testUnauthorizedAccess();
    await testInvalidData();
    await testNonExistentNovel();
    await testDeleteComment();

    console.log('\n🎉 All comment tests completed!');
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
};

runTests().catch(console.error);
