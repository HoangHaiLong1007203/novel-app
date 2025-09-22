# Backend Test Files

This directory contains comprehensive test files for the novel application backend API.

## Test Files Overview

### `testReviewAll.js`
Comprehensive test suite for the review functionality. Tests all review-related endpoints and features:

**Features Tested:**
- ✅ Create reviews with rating and content
- ✅ Review validation (rating 1-5, required fields)
- ✅ Reading progress requirement (80% completion)
- ✅ Get reviews by novel with pagination and sorting
- ✅ Reply to reviews (nested reviews)
- ✅ Like/unlike reviews
- ✅ Update own reviews
- ✅ Delete own reviews (soft delete)
- ✅ Get replies for specific reviews
- ✅ Error handling for unauthorized access
- ✅ Error handling for invalid data
- ✅ Error handling for non-existent resources
- ✅ Duplicate review prevention

**Test Scenarios:**
- Create review with valid data
- Create review with invalid rating (>5 or <1)
- Create review without reading requirement
- Get reviews with different sorting options (newest, oldest, highest, lowest)
- Get reviews with pagination
- Reply to reviews with valid/invalid data
- Like and unlike reviews
- Update own reviews vs. unauthorized updates
- Delete own reviews vs. unauthorized deletes
- Unauthorized access attempts
- Invalid novel IDs
- Duplicate review attempts
- Non-existent novel handling

**Setup Requirements:**
- MongoDB connection
- Two test users (automatically created)
- Test novel with multiple chapters
- Reading progress setup (80% completion)

**Cleanup:**
- Automatically deletes test users
- Automatically deletes test novel and related data
- Disconnects from MongoDB

## How to Run Tests

### Run Review Tests
```bash
cd backend
npm run test:review
```

### Run Other Tests
```bash
# Auth tests
node test/testAuthAll.js

# Comment tests
node test/testCommentAll.js

# Bookmark tests
node test/testBookmarkAll.js

# Notification tests
node test/testNotificationAll.js

# Novel tests
node test/testNovelAll.js

# Upload avatar tests
node test/testUploadAvatar.js
```

## Test Structure

Each test file follows a similar structure:

1. **Setup Phase:**
   - Connect to MongoDB
   - Create test users
   - Create test data (novels, chapters, etc.)
   - Setup prerequisites (reading progress, etc.)

2. **Test Phase:**
   - Test successful operations
   - Test error scenarios
   - Test edge cases
   - Test validation

3. **Cleanup Phase:**
   - Delete test data
   - Disconnect from MongoDB

## Environment Requirements

- Node.js
- MongoDB running
- Environment variables set (MONGO_URI, etc.)
- Backend server running on localhost:5000

## Test Data

Tests automatically create:
- Test users with unique emails
- Test novels with multiple chapters
- Reading progress records
- Reviews, replies, likes, etc.

All test data is automatically cleaned up after tests complete.

## Error Handling

Tests verify proper error responses for:
- 400 Bad Request (invalid data)
- 401 Unauthorized (missing auth)
- 403 Forbidden (insufficient permissions)
- 404 Not Found (non-existent resources)
- 409 Conflict (duplicate data)

## Notes

- Tests use axios for HTTP requests
- Tests run sequentially to maintain data consistency
- Each test file is independent and can be run separately
- Tests include comprehensive logging for debugging
- Failed tests will show detailed error information
