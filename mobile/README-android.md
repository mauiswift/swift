# Android Release Signing & Distribution

> **Current state (17 September 2026):** Android releases are auxiliary to the
> Railway-hosted Korea web deployment. Payment settlement remains controlled by the
> backend approval workflow; this document covers signing only.

This guide details secure signing and distribution for SwiftPay Android builds.

## 🔐 Institutional Signing Setup

1. **Hardware Security Module (HSM) / Key Generation**:
   Generate an institutional-grade release keystore for production nodes:

   ```bash
   keytool -genkeypair -v \
     -keystore paybot-mainnet-key.keystore \
     -alias industrial-node \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Secure Vault Injection**:
   Encode the keystore as base64 for secure storage in the institutional vault (GitHub Secrets):

   ```bash
   base64 -w0 paybot-mainnet-key.keystore > keystore.base64
   ```

3. **Node Distribution Secrets**:
   Configure the following in the production vault:
   - `ANDROID_KEYSTORE_BASE64`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`

## 📟 Client capabilities
- Device-bound authentication and operator access controls.
- Dynamic QR support where enabled by the configured backend.
- Backend-driven transaction status and reconciliation.

## 🏗️ Production Compliance
- Verify the configured API environment before distributing an APK.
- Validate the resulting APK through the project release process.
- **Crucial**: Institutional keys must NEVER be stored in the source grid.

---
*SwiftPay engineering documentation*
