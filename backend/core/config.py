diff --git a/backend/core/config.py b/backend/core/config.py
index 0008553..0000000 100644
--- a/backend/core/config.py
+++ b/backend/core/config.py
@@
     # JWT configuration
     jwt_secret_key: str = ""
     jwt_algorithm: str = "HS256"
     jwt_expire_minutes: int = 1440  # 24 hours (increased from 60 mins for better dashboard UX)
+
+    # Manual deposit / receipt matching settings
+    # Secret key for service/robot uploads (validate X-Service-Key header)
+    service_api_key: str = ""
+
+    # Amount tolerance when auto-matching receipts to transactions (in currency units)
+    receipt_match_tolerance: float = 0.5
@@
 settings = Settings()
