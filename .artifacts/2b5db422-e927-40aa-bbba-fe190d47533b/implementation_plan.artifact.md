# Implementation Plan - Fix Critical Deployment Issues

Address the critical issues identified in the recent deployment logs: Alembic migration conflicts, missing dependencies, and Telegram webhook failures.

## User Review Required

> [!IMPORTANT]
> - **Alembic Merge**: I will merge the two competing database migration heads into a single final consolidation revision. This will unblock database updates on the live server.
> - **Dependency Add**: I will add `xmltodict` to `requirements.txt`. This is required for the WeChat Pay service to load correctly.
> - **Telegram Webhook**: I will add logging to capture the exact URL being sent to Telegram to diagnose why it's returning a 400 Bad Request.

## Proposed Changes

### Backend Base

#### [MODIFY] [requirements.txt](file:///C:/Users/DELL/Desktop/swift/backend/requirements.txt)
- Add `xmltodict` to the dependencies list.

#### [NEW] [Alembic Merge Migration](file:///C:/Users/DELL/Desktop/swift/backend/alembic/versions/zzzz_final_consolidation.py)
- Create a new migration that merges `001_pos_terminals` and `77eb8934e7d1`.

### Telegram Service

#### [MODIFY] [telegram_service.py](file:///C:/Users/DELL/Desktop/swift/backend/services/telegram_service.py)
- Add explicit logging of the webhook URL being set.
- Improve error reporting for webhook setup failures.

## Verification Plan

### Automated Tests
- Run `alembic heads` locally to ensure only one head exists after the merge.
- Run a smoke test to verify `routers.payments` loads without `ModuleNotFoundError`.

### Manual Verification
- Check the backend logs on the next deployment to verify that `setWebhook` succeeds (or provides more detail on why it failed).
