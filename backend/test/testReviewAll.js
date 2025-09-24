import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";
import Novel from "../models/Novel.js";
import Chapter from "../models/Chapter.js";
import Review from "../models/Review.js";
import ReadingProgress from "../models/ReadingProgress.js";

dotenv.config();

const BASE_URL = "http://localhost:5000/api";
const AUTH_BASE_URL = "http://localhost:5000/api/auth";
const REVIEW_BASE_URL = "http://localhost:5000/api/reviews";

// Test data
let accessToken = '';
let userId = '';
let testEmail = `testuser_${Date.now()}@example.com`;
let novelId = '';
let chapterId = '';
let chapterIds = []; // Store all chapter IDs
let reviewId = '';
let replyId = '';
let anotherUserToken = '';
let anotherUserId = '';
let anotherUserEmail = `testuser2_${Date.now()}@example.com`;

// Helper function to make authenticated requests
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

// Helper function to make requests with different user token
const makeAuthRequestAsUser2 = async (method, url, body = null) => {
  const config = {
    method,
    url,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anotherUserToken}`,
    },
  };

  if (body) {
    config.data = body;
  }

  const response = await axios(config);
  return response;
};

// Setup: Register and login users
const setupUsers = async () => {
  console.log('\n=== Setup Users ===');
  try {
    // Register first user
    await axios.post(`${AUTH_BASE_URL}/register`, {
      username: "testuser1",
      email: testEmail,
      password: "123456",
    });
    console.log("✅ User 1 registration successful");

    // Login first user
    const loginRes = await axios.post(`${AUTH_BASE_URL}/login`, {
      email: testEmail,
      password: "123456",
    });
    console.log("✅ User 1 login successful");
    accessToken = loginRes.data.accessToken;
    
    // Decode the access token to get userId
    const decodedToken = verifyToken(loginRes.data.accessToken, process.env.ACCESS_TOKEN_SECRET);
    userId = decodedToken.userId;

    // Register second user
    await axios.post(`${AUTH_BASE_URL}/register`, {
      username: "testuser2",
      email: anotherUserEmail,
      password: "123456",
    });
    console.log("✅ User 2 registration successful");

    // Login second user
    const loginRes2 = await axios.post(`${AUTH_BASE_URL}/login`, {
      email: anotherUserEmail,
      password: "123456",
    });
    console.log("✅ User 2 login successful");
    anotherUserToken = loginRes2.data.accessToken;
    
    // Decode the access token to get anotherUserId
    const decodedToken2 = verifyToken(loginRes2.data.accessToken, process.env.ACCESS_TOKEN_SECRET);
    anotherUserId = decodedToken2.userId;
  } catch (err) {
    console.log("❌ Setup users failed:", err.response?.data || err.message);
    throw err;
  }
};

// Setup: Create a test novel and chapters
const setupNovelAndChapters = async () => {
  console.log('\n=== Setup Novel and Chapters ===');
  try {
    // Create novel
    const novelRes = await makeAuthRequest('POST', `${BASE_URL}/novels`, {
      title: 'Test Novel for Reviews',
      description: 'A test novel for review testing',
      genres: 'fantasy,adventure',
      type: 'sáng tác',
      status: 'còn tiếp',
    });

    novelId = novelRes.data.novel._id;
    console.log('✅ Novel created:', novelRes.data.novel.title);

    // Create multiple chapters
    for (let i = 1; i <= 5; i++) {
      const chapterRes = await makeAuthRequest('POST', `${BASE_URL}/novels/${novelId}/chapters`, {
        chapterNumber: i,
        title: `Test Chapter ${i}`,
        content: `This is test chapter ${i} content for review testing. It needs to be long enough to test reading progress.`,
      });

      if (i === 1) {
        chapterId = chapterRes.data.chapter._id;
      }
      chapterIds.push(chapterRes.data.chapter._id);
      console.log(`✅ Chapter ${i} created:`, chapterRes.data.chapter.title);
    }
  } catch (err) {
    console.log("❌ Setup novel/chapters failed:", err.response?.data || err.message);
    throw err;
  }
};

// Setup: Create reading progress for review eligibility
const setupReadingProgress = async () => {
  console.log('\n=== Setup Reading Progress ===');
  try {
    // Mark chapters as read (80% requirement)
    for (let i = 0; i < 4; i++) { // Read 4 out of 5 chapters = 80%
      await makeAuthRequest('POST', `${BASE_URL}/reading-progress`, {
        novelId: novelId,
        chapterId: chapterIds[i], // Use actual chapter IDs
        isRead: true,
      });
    }

    // Get the existing reading progress record (created by API calls above)
    const readingProgress = await ReadingProgress.findOne({
      user: userId,
      novel: novelId
    });

    if (!readingProgress) {
      throw new Error('Reading progress not found after API calls');
    }

    // Ensure the record has the correct data for review eligibility
    readingProgress.readChapters = chapterIds.slice(0, 4); // First 4 chapter IDs
    readingProgress.totalChaptersRead = 4;
    readingProgress.completionPercentage = 80;
    readingProgress.canReview = true;

    await readingProgress.save();

    console.log('✅ Reading progress setup completed (80% read)');
  } catch (err) {
    console.log("❌ Setup reading progress failed:", err.response?.data || err.message);
    throw err;
  }
};

// Test create review
const testCreateReview = async () => {
  console.log('\n=== Test Create Review ===');
  try {
    const reviewRes = await makeAuthRequest('POST', `${REVIEW_BASE_URL}`, {
      novelId: novelId,
      rating: 4,
      content: 'This is a great novel! Very engaging story and well-developed characters.',
    });

    reviewId = reviewRes.data.review._id;
    console.log('✅ Review created successfully');
    console.log('Review ID:', reviewId);
    console.log('Review rating:', reviewRes.data.review.rating);
    console.log('Review content:', reviewRes.data.review.content);
    console.log('Full review response:', JSON.stringify(reviewRes.data, null, 2));
  } catch (err) {
    console.log('❌ Create review failed:', err.response?.data || err.message);
    console.log('Full error:', err);
  }
};

// Test create review with invalid rating
const testCreateReviewInvalidRating = async () => {
  console.log('\n=== Test Create Review - Invalid Rating ===');
  try {
    await makeAuthRequest('POST', `${REVIEW_BASE_URL}`, {
      novelId: novelId,
      rating: 6, // Invalid rating > 5
      content: 'This review should fail due to invalid rating',
    });
    console.log('❌ Should have failed with invalid rating');
  } catch (err) {
    if (err.response?.status === 400) {
      console.log('✅ Invalid rating properly rejected');
    } else {
      console.log('❌ Unexpected error:', err.response?.data || err.message);
    }
  }
};

// Test create review without reading requirement
const testCreateReviewWithoutReading = async () => {
  console.log('\n=== Test Create Review - Without Reading Requirement ===');
  try {
    // Try to create review with second user who hasn't read the novel
    await makeAuthRequestAsUser2('POST', `${REVIEW_BASE_URL}`, {
      novelId: novelId,
      rating: 3,
      content: 'This review should fail due to reading requirement',
    });
    console.log('❌ Should have failed without reading requirement');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('✅ Reading requirement properly enforced');
    } else {
      console.log('❌ Unexpected error:', err.response?.data || err.message);
    }
  }
};

// Test get reviews by novel
const testGetReviewsByNovel = async () => {
  console.log('\n=== Test Get Reviews By Novel ===');
  try {
    const reviewsRes = await makeAuthRequest('GET', `${REVIEW_BASE_URL}/novel/${novelId}`);

    console.log(`✅ Retrieved ${reviewsRes.data.reviews.length} reviews`);
    reviewsRes.data.reviews.forEach(review => {
      console.log(`- Rating: ${review.rating}/5, Content: "${review.content.substring(0, 50)}..."`);
      console.log(`  User: ${review.user.username}, Likes: ${review.likes.length}`);
    });

    console.log(`Pagination: Page ${reviewsRes.data.pagination.currentPage}/${reviewsRes.data.pagination.totalPages}`);
  } catch (err) {
    console.log('❌ Get reviews failed:', err.response?.data || err.message);
  }
};

// Test get reviews with sorting
const testGetReviewsWithSorting = async () => {
  console.log('\n=== Test Get Reviews With Sorting ===');

  // Test highest rated first
  try {
    const highestRes = await makeAuthRequest('GET', `${REVIEW_BASE_URL}/novel/${novelId}?sort=highest`);
    console.log('✅ Reviews sorted by highest rating:', highestRes.data.reviews.length, 'reviews');
  } catch (err) {
    console.log('❌ Sort by highest failed:', err.response?.data || err.message);
  }

  // Test lowest rated first
  try {
    const lowestRes = await makeAuthRequest('GET', `${REVIEW_BASE_URL}/novel/${novelId}?sort=lowest`);
    console.log('✅ Reviews sorted by lowest rating:', lowestRes.data.reviews.length, 'reviews');
  } catch (err) {
    console.log('❌ Sort by lowest failed:', err.response?.data || err.message);
  }

  // Test oldest first
  try {
    const oldestRes = await makeAuthRequest('GET', `${REVIEW_BASE_URL}/novel/${novelId}?sort=oldest`);
    console.log('✅ Reviews sorted by oldest first:', oldestRes.data.reviews.length, 'reviews');
  } catch (err) {
    console.log('❌ Sort by oldest failed:', err.response?.data || err.message);
  }
};

// Test get reviews with pagination
const testGetReviewsWithPagination = async () => {
  console.log('\n=== Test Get Reviews With Pagination ===');
  try {
    const paginatedRes = await makeAuthRequest('GET', `${REVIEW_BASE_URL}/novel/${novelId}?page=1&limit=2`);

    console.log('✅ Pagination test successful');
    console.log(`Page ${paginatedRes.data.pagination.currentPage}/${paginatedRes.data.pagination.totalPages}`);
    console.log(`Total reviews: ${paginatedRes.data.pagination.totalReviews}`);
    console.log(`Has next page: ${paginatedRes.data.pagination.hasNextPage}`);
    console.log(`Has previous page: ${paginatedRes.data.pagination.hasPrevPage}`);
  } catch (err) {
    console.log('❌ Pagination test failed:', err.response?.data || err.message);
  }
};

// Test reply to review
const testReplyToReview = async () => {
  console.log('\n=== Test Reply To Review ===');
  console.log('reviewId:', reviewId);
  console.log('REVIEW_BASE_URL:', REVIEW_BASE_URL);

  // Check if reviewId exists
  if (!reviewId) {
    console.log('❌ reviewId is empty, cannot proceed with reply test');
    return;
  }

  try {
    const replyRes = await makeAuthRequest('POST', `${REVIEW_BASE_URL}/${reviewId}/reply`, {
      content: 'I completely agree! This novel is amazing and I love the character development.',
    });

    replyId = replyRes.data.reply._id;
    console.log('✅ Reply created successfully');
    console.log('Reply content:', replyRes.data.reply.content);
    console.log('Reply has rating:', replyRes.data.reply.rating !== undefined ? 'Yes' : 'No');
  } catch (err) {
    console.log('❌ Reply failed:', err.response?.data || err.message);
    console.log('Full error:', err);
  }
};

// Test reply to review with invalid data
const testReplyToReviewInvalid = async () => {
  console.log('\n=== Test Reply To Review - Invalid Data ===');
  try {
    await makeAuthRequest('POST', `${REVIEW_BASE_URL}/${reviewId}/reply`, {
      content: '', // Empty content should fail
    });
    console.log('❌ Should have failed with empty content');
  } catch (err) {
    if (err.response?.status === 400) {
      console.log('✅ Invalid reply data properly rejected');
    } else {
      console.log('❌ Unexpected error:', err.response?.data || err.message);
    }
  }
};

// Test like review
const testLikeReview = async () => {
  console.log('\n=== Test Like Review ===');
  try {
    const likeRes = await makeAuthRequestAsUser2('POST', `${REVIEW_BASE_URL}/${reviewId}/like`);

    console.log('✅ Review liked successfully');
    console.log(`Likes count: ${likeRes.data.likesCount}, Is liked: ${likeRes.data.isLiked}`);
  } catch (err) {
    console.log('❌ Like review failed:', err.response?.data || err.message);
  }
};

// Test unlike review
const testUnlikeReview = async () => {
  console.log('\n=== Test Unlike Review ===');
  try {
    const unlikeRes = await makeAuthRequestAsUser2('POST', `${REVIEW_BASE_URL}/${reviewId}/like`);

    console.log('✅ Review unliked successfully');
    console.log(`Likes count: ${unlikeRes.data.likesCount}, Is liked: ${unlikeRes.data.isLiked}`);
  } catch (err) {
    console.log('❌ Unlike review failed:', err.response?.data || err.message);
  }
};

// Test update review
const testUpdateReview = async () => {
  console.log('\n=== Test Update Review ===');
  try {
    const updateRes = await makeAuthRequest('PUT', `${REVIEW_BASE_URL}/${reviewId}`, {
      rating: 5,
      content: 'Updated review: This novel is even better than I initially thought!',
    });

    console.log('✅ Review updated successfully');
    console.log('Updated rating:', updateRes.data.review.rating);
    console.log('Updated content:', updateRes.data.review.content);
    console.log('Edit count:', updateRes.data.review.editCount);
  } catch (err) {
    console.log('❌ Update review failed:', err.response?.data || err.message);
  }
};

// Test update review by another user (should fail)
const testUpdateReviewUnauthorized = async () => {
  console.log('\n=== Test Update Review - Unauthorized ===');
  try {
    await makeAuthRequestAsUser2('PUT', `${REVIEW_BASE_URL}/${reviewId}`, {
      rating: 3,
      content: 'This should not be allowed',
    });
    console.log('❌ Should have failed to update another user\'s review');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('✅ Unauthorized update properly rejected');
    } else {
      console.log('❌ Unexpected error:', err.response?.data || err.message);
    }
  }
};

// Test delete review
const testDeleteReview = async () => {
  console.log('\n=== Test Delete Review ===');
  try {
    const deleteRes = await makeAuthRequest('DELETE', `${REVIEW_BASE_URL}/${reviewId}`);

    console.log('✅ Review deleted successfully');
  } catch (err) {
    console.log('❌ Delete review failed:', err.response?.data || err.message);
  }
};

// Test delete review by another user (should fail)
const testDeleteReviewUnauthorized = async () => {
  console.log('\n=== Test Delete Review - Unauthorized ===');
  try {
    await makeAuthRequestAsUser2('DELETE', `${REVIEW_BASE_URL}/${reviewId}`);
    console.log('❌ Should have failed to delete another user\'s review');
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('✅ Unauthorized delete properly rejected');
    } else {
      console.log('❌ Unexpected error:', err.response?.data || err.message);
    }
  }
};

// Test get review replies
const testGetReviewReplies = async () => {
  console.log('\n=== Test Get Review Replies ===');
  try {
    const repliesRes = await makeAuthRequest('GET', `${REVIEW_BASE_URL}/${reviewId}/replies`);

    console.log(`✅ Retrieved ${repliesRes.data.replies.length} replies`);
    repliesRes.data.replies.forEach(reply => {
      console.log(`- Reply: "${reply.content.substring(0, 50)}..."`);
      console.log(`  Rating: ${reply.rating}/5, User: ${reply.user.username}`);
    });
  } catch (err) {
    console.log('❌ Get replies failed:', err.response?.data || err.message);
  }
};

// Test unauthorized access
const testUnauthorizedAccess = async () => {
  console.log('\n=== Test Unauthorized Access ===');
  try {
    await axios.post(`${REVIEW_BASE_URL}`, {
      novelId: novelId,
      rating: 4,
      content: 'Unauthorized review',
    });
    console.log('❌ Should have failed without authentication');
  } catch (err) {
    if (err.response?.status === 401) {
      console.log('✅ Unauthorized access properly blocked');
    } else {
      console.log('❌ Unexpected error:', err.response?.data || err.message);
    }
  }
};

// Test invalid novel ID
const testInvalidNovelId = async () => {
  console.log('\n=== Test Invalid Novel ID ===');
  try {
    await makeAuthRequest('POST', `${REVIEW_BASE_URL}`, {
      novelId: '507f1f77bcf86cd799439011', // Invalid ObjectId
      rating: 4,
      content: 'This should fail with invalid novel ID',
    });
    console.log('❌ Should have failed with invalid novel ID');
  } catch (err) {
    if (err.response?.status === 404) {
      console.log('✅ Invalid novel ID properly handled');
    } else {
      console.log('❌ Unexpected error:', err.response?.data || err.message);
    }
  }
};

// Test duplicate review (should fail)
const testDuplicateReview = async () => {
  console.log('\n=== Test Duplicate Review ===');
  try {
    await makeAuthRequest('POST', `${REVIEW_BASE_URL}`, {
      novelId: novelId,
      rating: 3,
      content: 'This should fail as duplicate review',
    });
    console.log('❌ Should have failed with duplicate review');
  } catch (err) {
    if (err.response?.status === 400) {
      console.log('✅ Duplicate review properly rejected');
    } else {
      console.log('❌ Unexpected error:', err.response?.data || err.message);
    }
  }
};

// Test get reviews for non-existent novel
const testNonExistentNovel = async () => {
  console.log('\n=== Test Non-existent Novel ===');
  try {
    await makeAuthRequest('GET', `${REVIEW_BASE_URL}/novel/507f1f77bcf86cd799439011`);
    console.log('❌ Should have failed with non-existent novel');
  } catch (err) {
    if (err.response?.status === 404) {
      console.log('✅ Non-existent novel properly handled');
    } else {
      console.log('❌ Unexpected error:', err.response?.data || err.message);
    }
  }
};

// Cleanup: Delete test data
const cleanup = async () => {
  console.log('\n=== Cleanup ===');
  try {
    // Delete test users
    await User.deleteMany({ email: { $in: [testEmail, anotherUserEmail] } });
    console.log('✅ Test users deleted');

    // Delete test novel and related data
    if (novelId) {
      await Novel.findByIdAndDelete(novelId);
      await Chapter.deleteMany({ novel: novelId });
      await Review.deleteMany({ novel: novelId });
      await ReadingProgress.deleteMany({ novel: novelId });
      console.log('✅ Test novel and related data deleted');
    }

    console.log('✅ Cleanup completed');
  } catch (err) {
    console.log('❌ Cleanup failed:', err.message);
  }
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting Review API Tests...');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected for test");

    await setupUsers();
    if (!accessToken || !anotherUserToken) {
      console.log('❌ Cannot proceed without login tokens');
      return;
    }

    await setupNovelAndChapters();
    if (!novelId) {
      console.log('❌ Cannot proceed without novel');
      return;
    }

    await setupReadingProgress();

    // Test successful operations
    await testCreateReview();
    await testGetReviewsByNovel();
    await testGetReviewsWithSorting();
    await testGetReviewsWithPagination();
    await testReplyToReview();
    await testLikeReview();
    await testUnlikeReview();
    await testUpdateReview();
    await testGetReviewReplies();

    // Test error cases
    await testCreateReviewInvalidRating();
    await testCreateReviewWithoutReading();
    await testReplyToReviewInvalid();
    await testUpdateReviewUnauthorized();
    await testDeleteReviewUnauthorized();
    await testUnauthorizedAccess();
    await testInvalidNovelId();
    await testDuplicateReview();
    await testNonExistentNovel();

    // Test delete after other operations
    await testDeleteReview();

    console.log('\n🎉 All review tests completed!');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  } finally {
    await cleanup();
    await mongoose.disconnect();
    console.log("✅ MongoDB disconnected, test hoàn tất");
  }
};

runTests().catch(console.error);
