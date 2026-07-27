# Maintenance Page Integration Guide

## Overview

This guide provides complete instructions for integrating the maintenance page system into your SwiftPay PH application. The system includes:

- **Backend Router** (`backend/routers/maintenance.py`) - Handles maintenance state management and API endpoints
- **Frontend Component** (`frontend/src/pages/Maintenance.tsx`) - Password-protected maintenance UI
- **Middleware** - Intercepts requests during maintenance mode
- **Admin Controls** - Toggle maintenance on/off, set messages and estimated end times

---

## Features

✅ **Password Protection** - Only admins and testers can access the maintenance page
✅ **Toggleable** - Turn maintenance mode on/off instantly
✅ **Customizable Messages** - Set custom maintenance messages
✅ **Estimated End Time** - Display countdown to estimated service restoration
✅ **Role-Based Access** - Admin and tester roles have special privileges
✅ **Real-time Status** - Poll API for live maintenance status
✅ **SwiftPay PH Branding** - Professional maintenance page with your brand logo

---

## Backend Setup

### 1. Update Main App File

Add the maintenance router to your FastAPI application in `backend/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import maintenance, events, disbursements, customers, subscriptions
from middleware import MaintenanceMiddleware

app = FastAPI(title="SwiftPay PH API")

# Add CORS middleware
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Add Maintenance Middleware FIRST (before other middleware)
app.add_middleware(MaintenanceMiddleware)

# Include routers
app.include_router(maintenance.router)
app.include_router(events.router)
app.include_router(disbursements.router)
app.include_router(customers.router)
app.include_router(subscriptions.router)
```

### 2. Database Models (Optional - for persistence)

If you want to persist maintenance state to database:

```python
# backend/models.py
from sqlalchemy import Column, String, DateTime, Boolean
from database import Base

class MaintenanceState(Base):
    __tablename__ = "maintenance_state"
    
    id = Column(Integer, primary_key=True)
    is_active = Column(Boolean, default=False)
    message = Column(String(500))
    started_at = Column(DateTime)
    estimated_end_at = Column(DateTime)
    last_toggled_by = Column(String)
    total_toggles = Column(Integer, default=0)
```

### 3. Database Migration (if using persistence)

```bash
alembic revision --autogenerate -m "Add maintenance state table"
alembic upgrade head
```

---

## Frontend Setup

### 1. Add Maintenance Route

Update your router configuration in `frontend/src/main.tsx` or `frontend/src/app.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MaintenancePage from '@/pages/Maintenance';
import Dashboard from '@/pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Other routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

### 2. Environment Variables

Add to `frontend/.env`:

```env
VITE_MAINTENANCE_PASSWORD=#Kuyaden1216
```

### 3. API Configuration

Update `frontend/src/lib/api.ts` or similar:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Check maintenance status before each request
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 503) {
      // Service unavailable - redirect to maintenance page
      window.location.href = '/maintenance';
    }
    return Promise.reject(error);
  }
);
```

---

## API Endpoints

### Get Maintenance Status
```http
GET /maintenance/status
```

**Response:**
```json
{
  "is_active": true,
  "message": "We are under maintenance",
  "started_at": "2026-07-15T18:00:00Z",
  "estimated_end_at": "2026-07-15T20:00:00Z",
  "can_access": false
}
```

### View Maintenance Page (Admin/Tester Only)
```http
GET /maintenance/page
```

**Response:**
```json
{
  "is_active": true,
  "message": "System maintenance",
  "started_at": "2026-07-15T18:00:00Z",
  "estimated_end_at": "2026-07-15T20:00:00Z",
  "last_toggled_by": "admin@swiftpay.ph",
  "total_toggles": 3,
  "accessed_by": "admin@swiftpay.ph",
  "accessed_at": "2026-07-15T18:05:00Z"
}
```

### Toggle Maintenance Mode (Admin Only)
```http
POST /maintenance/toggle
Content-Type: application/json

{
  "is_active": true,
  "message": "Emergency maintenance - please stand by",
  "estimated_end_at": "2026-07-15T22:00:00Z"
}
```

### End Maintenance Immediately (Admin Only)
```http
POST /maintenance/end
```

### Get Maintenance Statistics (Admin/Tester Only)
```http
GET /maintenance/stats
```

---

## Deployment Instructions

### Step 1: Deploy Backend

```bash
# 1. Commit changes
git add backend/routers/maintenance.py backend/main.py
git commit -m "Add maintenance system"

# 2. Push to repository
git push origin main

# 3. Deploy using your hosting provider (Railway, Render, etc.)
# For Railway:
railway up

# For Render:
git push origin main  # Auto-deploy on push
```

### Step 2: Deploy Frontend

```bash
# 1. Build frontend
cd frontend
pnpm install
pnpm build

# 2. Commit changes
git add src/pages/Maintenance.tsx
git commit -m "Add maintenance UI with SwiftPay PH branding"

# 3. Push changes
git push origin main

# 4. Frontend will redeploy automatically or via your CI/CD pipeline
```

### Step 3: Verify Deployment

```bash
# Test maintenance status endpoint
curl https://your-domain.com/maintenance/status

# Test authentication
curl -X POST https://your-domain.com/maintenance/toggle \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": true, "message": "Testing"}'
```

---

## Usage Examples

### Using cURL

#### Check Status
```bash
curl https://api.swiftpay.ph/maintenance/status
```

#### Enable Maintenance (requires auth)
```bash
curl -X POST https://api.swiftpay.ph/maintenance/toggle \
  -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": true,
    "message": "Emergency maintenance in progress",
    "estimated_end_at": "2026-07-15T20:00:00Z"
  }'
```

#### Disable Maintenance
```bash
curl -X POST https://api.swiftpay.ph/maintenance/toggle \
  -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

### Using Python

```python
import requests
from datetime import datetime, timedelta

BASE_URL = "https://api.swiftpay.ph"
AUTH_TOKEN = "your_admin_token"

headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}

# Enable maintenance
response = requests.post(
    f"{BASE_URL}/maintenance/toggle",
    headers=headers,
    json={
        "is_active": True,
        "message": "System upgrade in progress",
        "estimated_end_at": (datetime.utcnow() + timedelta(hours=2)).isoformat()
    }
)

print(response.json())
```

### Using TypeScript/JavaScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://api.swiftpay.ph',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

// Enable maintenance
async function enableMaintenance() {
  const response = await api.post('/maintenance/toggle', {
    is_active: true,
    message: 'Emergency maintenance - we will be back soon!',
    estimated_end_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  });
  return response.data;
}

// Disable maintenance
async function disableMaintenance() {
  const response = await api.post('/maintenance/end');
  return response.data;
}
```

---

## Configuration

### Frontend Configuration

Edit `frontend/src/pages/Maintenance.tsx`:

```typescript
// Toggle maintenance on/off
const MAINTENANCE_ENABLED = true; // Set to false to disable

// Change password
const MAINTENANCE_PASSWORD = '#Kuyaden1216';
```

### Backend Configuration

Edit environment variables in deployment:

```env
MAINTENANCE_ENABLED=true
MAINTENANCE_PASSWORD=#Kuyaden1216
```

---

## Security Considerations

1. **Password Security**
   - Use strong passwords (already using `#Kuyaden1216`)
   - Change password regularly
   - Never commit passwords to version control

2. **Authentication**
   - Ensure all admin endpoints require valid JWT tokens
   - Validate user roles (admin/tester) on backend
   - Log all maintenance toggle events

3. **HTTPS**
   - Always use HTTPS in production
   - Redirect HTTP to HTTPS

4. **Rate Limiting**
   - Add rate limiting to `/maintenance/toggle` endpoint
   - Prevent brute force attacks on password endpoint

---

## Troubleshooting

### Maintenance Page Not Loading

**Problem:** 404 error when accessing `/maintenance`

**Solution:**
1. Verify route is added in `App.tsx`
2. Check file path: `frontend/src/pages/Maintenance.tsx`
3. Rebuild frontend: `pnpm build`

### Password Not Working

**Problem:** "Incorrect password" error

**Solution:**
1. Verify password is `#Kuyaden1216`
2. Check browser console for typos
3. Clear browser cache and localStorage
4. Verify `MAINTENANCE_ENABLED = true`

### API Endpoints Returning 403

**Problem:** "Access denied" when calling admin endpoints

**Solution:**
1. Verify user role in database (should be 'admin' or 'tester')
2. Check JWT token validity and expiration
3. Verify Authorization header is included
4. Check backend logs for permission errors

### Maintenance Mode Persists

**Problem:** Can't disable maintenance mode

**Solution:**
1. Set `MAINTENANCE_ENABLED = false` in frontend
2. Call POST `/maintenance/end` endpoint
3. Verify authentication token is valid
4. Check server logs for errors

---

## Support & Monitoring

### Health Check Endpoint (Optional)

```python
@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "maintenance_active": maintenance_state["is_active"]
    }
```

### Metrics to Monitor

- Maintenance toggle count
- Last toggle timestamp
- Current maintenance duration
- Admin access attempts
- Failed password attempts

---

## Rollback Instructions

If you need to revert to previous state:

```bash
# Revert last commit
git revert HEAD

# Or reset to specific commit
git reset --hard <commit_hash>

# Redeploy
railway up  # or your deployment command
```

---

## Next Steps

1. ✅ Deploy backend router
2. ✅ Deploy frontend component
3. ✅ Test all endpoints
4. ✅ Configure authentication
5. ✅ Set up monitoring/logging
6. ✅ Train admin team on usage
7. ✅ Document for team wiki

---

## Support Contact

For questions or issues, contact your development team or create an issue in the repository.

**Maintenance Password:** `#Kuyaden1216`

---

**Last Updated:** July 15, 2026
**Version:** 1.0.0
