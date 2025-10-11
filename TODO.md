# TODO for Fixing User Uploaded Novels Display

## Task: Fix the "posted stories" section on the upload page to show only the current user's novels.

### Steps:
- [x] Edit `frontend2/src/app/(user)/upload/page.tsx` to change the API query parameter from `authorId` to `poster` in the useEffect for fetching user novels.
- [ ] Verify the change by testing the upload page (user can check if only their novels appear).
