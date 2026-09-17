# SwiftPay POS Terminal (Android)

> **Repository status (17 September 2026):** This Android client is an auxiliary
> integration surface. The Korea web deployment and approval workflow are maintained
> in the backend/frontend packages; verify the configured API environment before
> producing a release build.

POS Terminal application for the SwiftPay ecosystem. Built with React Native.

## 🚀 Live Configuration
- **API**: Configure the target environment in `Config.ts`; do not assume the Korea
  host for every build.
- **Build Target**: Release APK
- **Payment Engine**: Provider configuration is environment-specific.
- **Settlement**: Subject to the backend approval workflow.

## 🛠 Features
- ✅ **Secure Login**: JWT-based auth with device unique ID binding.
- ✅ **Operator PIN**: Quick access locking for terminal operators.
- ✅ **Real-time Sync**: Instant payment notifications via backend event bus.
- ✅ **Multi-Method**: Support for Cards, Maya QR, GCash, and GrabPay.
- ✅ **Dynamic QR**: Real-time generation of scan-to-pay codes.

## 📦 Build Instructions

### Production Build
To generate the release APK for distribution:
1. Ensure `mobile/android/src/Config.ts` is set to the production URL.
2. Run the build script from the root:
```powershell
powershell -ExecutionPolicy Bypass -File ./build_apk.ps1
```
3. Find the signed APK in: `mobile/android/android/app/build/outputs/apk/release/app-release.apk`

## 🔐 Security
- **Device Binding**: Each session is locked to the physical device ID.
- **X-Device-ID**: Every request includes the unique device identifier for verification.
- **SSL Only**: Communication is strictly over HTTPS.

## Troubleshooting
- **Assignment Required**: If the app shows "Waiting for Assignment", the device must be linked to a user in the Admin Dashboard.
- **Connection Error**: Verify the `API_BASE_URL` in `Config.ts` is reachable from the device network.

---
*Developed by DRL Solutions*
