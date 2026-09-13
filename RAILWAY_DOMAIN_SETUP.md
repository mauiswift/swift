# Railway Domain Setup: kr.swiftpay.site

## Status
**Manual web UI configuration required** due to project-scoped token limitations.

## Instructions to Complete Domain Setup

### Step 1: Access Railway Dashboard
1. Open https://railway.app in your browser
2. Sign in with your Railway account (st.den16@outlook.com)
3. Navigate to your **swift** project

### Step 2: Add Custom Domain to Backend Service
1. Click on the **backend** service
2. Go to the **Domains** tab (top menu)
3. Click **"+ Add Domain"** button
4. Enter: **kr.swiftpay.site**
5. Set Port: **8000** (as configured in railway.json)
6. Click **"Create Domain"**

### Step 3: Configure DNS Records
Railway will display DNS records needed. You must add these at your domain registrar (GoDaddy, Namecheap, etc.):

- **CNAME Record**: Point your domain to the Railway-provided endpoint
  - OR **A Record**: Use the Railway IP address provided
- **TXT Record**: For domain ownership verification (required)

### Step 4: Verify DNS Propagation
- DNS can take up to 72 hours to propagate globally
- Once propagated, Railway will automatically issue an SSL certificate
- Your domain kr.swiftpay.site will route to the backend service on port 8000

### Project Information
- **Project ID**: 6258a878-5973-499c-b0af-98565c4023bd
- **Project URL**: https://railway.app/project/6258a878-5973-499c-b0af-98565c4023bd
- **Service**: backend
- **Port**: 8000

### Environment Variables
Your railway.json is configured for production:
- `ENVIRONMENT`: production
- `FRONTEND_URL`: https://kr.swiftpay.site
- `PUBLIC_CHECKOUT_HOST`: https://kr.swiftpay.site
- `PYTHON_BACKEND_URL`: https://api.swiftpay.site

## Next Steps
1. Complete the web UI setup above
2. Add DNS records at your domain registrar
3. Wait for DNS propagation (can take 72 hours)
4. Test by visiting https://swiftpay.site
