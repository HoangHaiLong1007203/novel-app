# TODO for Fixing User Uploaded Novels Display

## Task: Fix the "posted stories" section on the upload page to show only the current user's novels.

### Steps:
- [x] Edit `frontend2/src/app/(user)/upload/page.tsx` to change the API query parameter from `authorId` to `poster` in the useEffect for fetching user novels.
- [ ] Verify the change by testing the upload page (user can check if only their novels appear).

## Task: Extract novel creation form into reusable NovelForm component

### Steps:
- [x] Create frontend2/src/components/novel/NovelForm.tsx with extracted form logic and JSX.
- [x] Update frontend2/src/app/(user)/upload/page.tsx to import and use NovelForm component, removing the inline form.
- [x] Test the changes: Run dev server, navigate to upload page, verify form works identically.
