# Production Deployment Guide: Downline Feature

## Overview
This guide walks through deploying the Downline Feature from st-den16/swift to mauiswift/swift production environment.

## Changes Summary
- **Service Fee Management**: Added `service_fee_percent` to AdminUser model
- **Downline Relationships**: New table tracking user hierarchies and commissions
- **API Endpoints**: New downline management endpoints
- **Frontend**: Service fee configuration UI in AdminManagement

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Database backup completed
- [ ] Team notified of maintenance window
- [ ] Rollback plan reviewed

## Deployment Steps

### 1. Merge to Main Branch

```bash
# Create pull request from sync/downline-feature to main
# Link: https://github.com/mauiswift/swift/compare/main...sync/downline-feature
```

### 2. Database Migration

```bash
# Connect to production database
cd backend

# Run migration
alembic upgrade head

# Verify migration
alembic current
```

### 3. Deploy Backend

```bash
# Pull latest main
git pull origin main

# Install dependencies
pip install -r requirements.txt

# Restart services
systemctl restart paybot-backend

# Verify health
curl https://api.mauiswift.com/health
```

### 4. Deploy Frontend

```bash
cd frontend

# Install dependencies
npm install

# Build production
npm run build

# Deploy to CDN/hosting
npm run deploy
```

### 5. Post-Deployment Validation

**Backend Checks**:
- [ ] Service fee endpoint responsive: `PUT /api/v1/app-settings/users/{id}/service-fee`
- [ ] Downline endpoints active: `POST /api/v1/downlines/relationships`
- [ ] Downline list endpoint: `GET /api/v1/downlines/{user_id}`

**Frontend Checks**:
- [ ] Admin Management page loads
- [ ] Service fee field visible for super admins
- [ ] Fee updates save correctly

**Database Checks**:
```sql
-- Verify service_fee_percent populated
SELECT COUNT(*) FROM admin_users WHERE service_fee_percent IS NOT NULL;

-- Verify downline table created
SELECT COUNT(*) FROM downline;
```

## Rollback Plan

### If Issues Occur

```bash
# Revert to previous version
git revert <merge-commit-sha>
git push origin main

# Downgrade database
cd backend
alembic downgrade -1

# Restart services
systemctl restart paybot-backend
```

## Monitoring

**Key Metrics to Watch**:
- API response times (should remain < 200ms)
- Error rate for downline endpoints
- Database migration completion time

**Logs to Check**:
```bash
# Backend logs
tail -f /var/log/paybot-backend/error.log

# Database migration logs
tail -f /var/log/alembic/migration.log
```

## Support

For issues during deployment:
1. Check error logs in `/var/log/paybot-backend/`
2. Verify database connectivity
3. Contact DevOps team
4. Reference commit: `283b376441f1719ce7ecb6817baca20c6d4b4d9b`

---

**Deployment Date**: 2026-09-11  
**Version**: 1.0.0  
**Deployed By**: meblackhorse11
