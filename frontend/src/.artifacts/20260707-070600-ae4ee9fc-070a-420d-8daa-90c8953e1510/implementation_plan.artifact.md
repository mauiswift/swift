# Fix warnings and errors in ScanQRPH.tsx

The goal is to resolve static analysis warnings and potential runtime issues in `ScanQRPH.tsx`.

## Proposed Changes

### [Frontend] (file:///C:/Users/DELL/Desktop/paybot/frontend/src/pages/ScanQRPH.tsx)

#### [ScanQRPH.tsx](file:///C:/Users/DELL/Desktop/paybot/frontend/src/pages/ScanQRPH.tsx)

- **Authentication Guard**: Use the return value of `useAuth()` and implement a redirect if the user is not authenticated, consistent with other protected pages like `Dashboard.tsx`.
- **Improved Error Handling**: Refine the `catch` block in `handlePay` to safely access error details without risky type assertions.
- **Result Rendering**: Fix the logic that skips `0` values when displaying the payment result.
- **HTML Validity**: Correct the nesting of a `div` inside a `span` within `CardTitle`.
- **Import Cleanup**: Ensure all imports are used and correctly typed.

```diff
 export default function ScanQRPH() {
-  useAuth();
+  const { user, loading: authLoading } = useAuth();
+  const navigate = useNavigate();
+
+  useEffect(() => {
+    if (!authLoading && !user) {
+      navigate('/login', { replace: true });
+    }
+  }, [user, authLoading, navigate]);

...

-    } catch (err: unknown) {
-      toast.error((err as { data?: { detail?: string } })?.data?.detail || 'Payment failed');
+    } catch (err: any) {
+      const message = err?.data?.detail || err?.message || 'Payment failed';
+      toast.error(message);
     } finally {

...

-                if (!value || key === 'success') return null;
+                if (value === null || value === undefined || key === 'success') return null;
```

### [Frontend Components] (file:///C:/Users/DELL/Desktop/paybot/frontend/src/components/Layout.tsx)

#### [Layout.tsx](file:///C:/Users/DELL/Desktop/paybot/frontend/src/components/Layout.tsx)

- **Fix Missing Import**: Add `QrCode` to the `lucide-react` import list to fix the broken navigation icon.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` on the file to ensure no type errors.
- Run `npx eslint` on the file to ensure no lint warnings.

### Manual Verification
- Verify that navigating to `/scan-qrph` while logged out redirects to `/login`.
- Verify that the payment result correctly displays `0` if present (e.g., `fee: 0`).
- Verify that the UI renders correctly without console warnings about invalid HTML nesting.
