# Implementation Plan - Fix Store Branding & Upload Issues

This plan addresses the reported "An error occurred" issue when uploading logos or saving long logo URLs. The primary cause is likely a database column size limitation (512 characters) being exceeded by long external asset URLs.

## Proposed Changes

### Backend - Database Schema

#### [MODIFY] [merchant_api_config.py](file:///C:/Users/DELL/Desktop/swift-main/backend/models/merchant_api_config.py)
- Increase `store_logo_url` column length from `512` to `2048` to accommodate long external asset URLs.

#### [NEW] [increase_logo_url_length.py](file:///C:/Users/DELL/Desktop/swift-main/backend/alembic/versions/increase_logo_url_length.py)
- Alembic migration to apply the column size increase.

### Backend - API Logic

#### [MODIFY] [merchant_api.py](file:///C:/Users/DELL/Desktop/swift-main/backend/routers/merchant_api.py)
- Add detailed logging to `update_merchant_api_config` and `upload_merchant_logo` to capture the exact cause of any failures.
- Ensure the `uploads/logos` directory is correctly handled and reachable.

### Frontend - UI Stability

#### [MODIFY] [StoreProfile.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/pages/settings/StoreProfile.tsx)
- Enhance `handleSave` and `handleLogoUpload` to extract and display the specific error message from the server (e.g., "Field too long", "Invalid file type").
- Add a loading state to the "Save" button to prevent duplicate submissions.

## Verification Plan

### Manual Verification
1.  **Long URL Test:** Paste a very long image URL (over 600 chars) into the Alternative Logo URL field and click Save. Verify it works.
2.  **Upload Test:** Upload a local image and verify the "Uploading..." state and successful completion.
3.  **Error Check:** If a failure occurs, verify that the toast message shows a helpful error from the backend instead of a generic "An error occurred".
