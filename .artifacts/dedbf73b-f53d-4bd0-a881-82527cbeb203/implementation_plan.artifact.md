# Fix Alembic Migration Heads and Router Import Issues

The application is currently experiencing two main issues during startup:
1.  **Alembic Migration Failure**: "Multiple head revisions are present". This is caused by multiple divergent migration branches and a dependency cycle in the migration files.
2.  **Router Import Warnings**: "router module backend.routers.magpie not found". This is caused by hardcoded `backend.routers` package paths in `backend/routers/__init__.py`, which are incorrect in the container environment where the root is `/app/backend`.

## User Review Required

> [!IMPORTANT]
> The fix for Alembic involves modifying an existing migration file to break a dependency cycle. This is generally safe if the migrations use idempotency guards (which they do), but it's a significant change to the migration history.

> [!NOTE]
> I will create a new "final merge" migration to consolidate all 5+ current heads into a single linear path.

## Proposed Changes

### Alembic Migrations

#### [MODIFY] [u1v2w3x4y5z6_merge_r9_t6.py](file:///C:/Users/DELL/Desktop/swift/backend/alembic/versions/u1v2w3x4y5z6_merge_r9_t6.py)
- Remove `t6u7v8w9x0y1` from `down_revision` to break the dependency cycle: `u1v2w3x4y5z6 -> f3b4c5d6e7f8 -> ... -> t6u7v8w9x0y1 -> u1v2w3x4y5z6`.

#### [NEW] [zzzz_final_consolidation.py](file:///C:/Users/DELL/Desktop/swift/backend/alembic/versions/zzzz_final_consolidation.py)
- Create a new migration that merges all current heads:
    - `001`
    - `855c2ec2a47f`
    - `z9999_merge_heads`
    - `z9y8x7w6v5u4`
    - `add_uq_api_configs_service_key`
    - `t6u7v8w9x0y1` (now a head after breaking the cycle)

### Routers

#### [MODIFY] [__init__.py](file:///C:/Users/DELL/Desktop/swift/backend/routers/__init__.py)
- Update `_import_or_stub` to try importing without the `backend.` prefix first, or use relative imports. This will resolve the "module not found" warnings in the container environment.

## Verification Plan

### Automated Tests
- Run `alembic heads` to verify there is only one head.
- Run `alembic history` to verify the cycle is broken.
- Check application logs to ensure "router module not found" warnings are gone.

### Manual Verification
- Start the application and verify it reaches "Application startup complete" without Alembic errors or router warnings.
