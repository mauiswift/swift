# Railway Domain Setup: kr.swiftpay.site

## Status
**DNS is configured; Railway certificate validation is still pending.**

## Instructions to Complete Domain Setup

### Step 1: Access Railway Dashboard
1. Open https://railway.app in your browser
2. Sign in with your Railway account (st.den16@outlook.com)
3. Navigate to the **happy-hope** project

### Step 2: Add Custom Domain to the Swift Service
1. Click on the **swift** service
2. Go to the **Domains** tab (top menu)
3. Click **"+ Add Domain"** button
4. Enter: **kr.swiftpay.site**
5. Set Port: **8000** (as configured in railway.json)
6. Click **"Create Domain"**

### Step 3: Configure DNS Records
Railway will display DNS records needed. You must add these at your domain registrar (GoDaddy, Namecheap, etc.):

- **CNAME**: `kr` -> `q939acyr.up.railway.app` (DNS only)
- **TXT**: `_railway-verify.kr` -> the verification value shown by Railway

### Step 4: Verify DNS Propagation
- DNS is currently propagated for the CNAME and verification TXT record.
- Railway is still validating ownership before issuing the SSL certificate.
- Your domain kr.swiftpay.site routes to the swift service on port 8000

### Project Information
- **Project ID**: 6258a878-5973-499c-b0af-98565c4023bd
- **Project URL**: https://railway.app/project/6258a878-5973-499c-b0af-98565c4023bd
- **Service**: swift
- **Port**: 8000

### Environment Variables
Your railway.json is configured for production:
- `ENVIRONMENT`: production
- `FRONTEND_URL`: https://kr.swiftpay.site
- `PUBLIC_CHECKOUT_HOST`: https://kr.swiftpay.site
- `PYTHON_BACKEND_URL`: https://api.swiftpay.site

## Next Steps
1. Confirm the CNAME and TXT records remain in DNS-only mode.
2. Wait for Railway certificate validation to complete.
3. Test by visiting https://kr.swiftpay.site
