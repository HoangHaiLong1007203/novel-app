# TODO: Update testAuthAll.js for Change Username and Password Tests

## Completed Tasks
- [x] Analyze existing testAuthAll.js and backend auth functionality
- [x] Confirm endpoints and services for change username/password exist
- [x] Add test section for change username after login test
- [x] Add test section for change password after change username test

## Pending Tasks
- [ ] Run the updated testAuthAll.js script to verify the new tests work correctly
- [ ] Check console output for success messages on change username and password
- [ ] If errors occur, debug and fix any issues (e.g., ensure server is running on localhost:5000)
- [ ] Optionally, add error case tests (e.g., duplicate username, weak password) for completeness

## Notes
- Tests use the accessToken from login to authenticate PUT requests to /change-username and /change-password.
- New username: "newtestuser", new password: "newpassword123" (meets validation requirements).
- No cleanup needed for these tests as they update the existing user.

---

# TODO: Implement CRUD Routes for Novels

## Completed Tasks
- [x] Update Novel.js model to add poster, type, status, coverImageUrl fields
- [x] Create novelController.js with createNovel, getNovels, getNovelById, updateNovel, deleteNovel functions
- [x] Create novel.js routes file with CRUD endpoints
- [x] Update server.js to import and register novel routes at /api/novels
- [x] Add cover image upload functionality with default image
- [x] Update TODO.md with novel implementation progress

## Pending Tasks
- [x] Test the novel CRUD endpoints (e.g., create a novel, list novels with filters, view details, update, delete)
- [x] Ensure authentication works for create, update, delete
- [x] Handle edge cases (e.g., invalid type, non-existent author for dịch)
- [x] Add validation for required fields and data types
- [x] Thorough testing completed with testNovelAll.js script
- [x] Fixed registration and login logic in test script
- [x] Fixed auth endpoint URLs in test script
- [x] Reran tests with corrected URLs
- [ ] Optionally, add pagination for getNovels if needed

## Notes
- Create novel: POST /api/novels, requires auth, supports sáng tác (poster=author) and dịch/đăng lại (poster!=author)
- Get novels: GET /api/novels, supports filters by genres, author, poster, status (còn tiếp, tạm ngưng, hoàn thành)
- Get novel details: GET /api/novels/:id
- Update/Delete: Only poster can update/delete their novels
