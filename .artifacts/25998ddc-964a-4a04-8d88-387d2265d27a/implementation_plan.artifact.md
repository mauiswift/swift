# Implementation Plan - Fix Store Profile Branding (Logo & Name)

The user reported issues with uploading images and using image links in the Store Profile settings. After investigation, several technical issues were identified in the frontend API client and the upload handler.

## Proposed Changes

### Frontend - API Client

#### [MODIFY] [api.ts](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/lib/api.ts)
- Add the missing `patch` method to the `client` object. This is likely the cause of "An error occurred" when saving the Store Profile.
- Ensure consistent token retrieval by using `getStoredToken()` in all helper methods.

### Frontend - Store Profile Page

#### [MODIFY] [StoreProfile.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/pages/settings/StoreProfile.tsx)
- Update `handleLogoUpload` to use the `client` helper instead of raw `fetch` for consistency and better error handling.
- Add error logging to `handleSave` to help diagnose issues in the future.
- Ensure `Authorization` header is correctly passed for the file upload.

### Backend - Merchant API

#### [MODIFY] [merchant_api.py](file:///C:/Users/DELL/Desktop/swift-main/backend/routers/merchant_api.py)
- Refine the `logo_url` returned by `upload_merchant_logo`. If the app is served behind a proxy or on a specific domain, a relative URL starting with `/` is usually best, but we should ensure it's compatible with how `main.py` mounts static files.
- Add logging for file upload operations to debug permission or path issues.

## Verification Plan

### Manual Verification
1.  **Image Link:** Enter a valid image URL in the "Logo URL (Alternative)" field and click "Save Changes". Verify it persists and updates the branding.
2.  **Image Upload:** Upload a local image file. Verify that:
    - The file is saved on the server.
    - The UI updates with the new logo.
    - No "An error occurred" toast appears.
3.  **Persistence:** Refresh the page and verify the changes are still there.
