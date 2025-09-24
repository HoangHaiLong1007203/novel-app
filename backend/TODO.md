# Fix Reply to Review Functionality

## Issue
The `replyToReview` function is failing with a 500 Internal Server Error during testing.

## Steps to Complete

### 1. Fix Reading Progress Logic
- [x] Remove problematic ReadingProgress creation logic in `replyToReview` function
- [x] Simplify reading progress validation
- [x] Add better error handling around database operations

### 2. Test the Fix
- [ ] Run the specific failing test to verify the fix
- [ ] Ensure all other review functionality still works correctly

### 3. Verify Database Operations
- [ ] Ensure reply creation and novel rating update operations work correctly
- [ ] Check that the `updateNovelAverageRating` function is called properly
