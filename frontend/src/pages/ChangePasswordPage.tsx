import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/FormComponents';
import { Alert } from '@/components/DataDisplay';
import { SPACING } from '@/lib/design-system';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, loading, changePassword, logout } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Show loading state while auth context is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-600 text-lg font-medium">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if no user after loading
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setPageError(null);

    if (!newPassword.trim() || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await changePassword(newPassword, confirmPassword);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to update your password.';
      console.error('Password change error:', errorMsg);
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
        {/* Header Section */}
        <div className={`border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50 ${SPACING.responsive.contentPadding}`}>
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">🔒 Security</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Change your password</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            For your protection, this page appears after every successful login until the password has been changed successfully.
          </p>
        </div>

        {/* Content Section */}
        <div className={SPACING.responsive.contentPadding}>
          {pageError && (
            <Alert
              type="error"
              title="System Error"
              message={pageError}
              onClose={() => setPageError(null)}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField
              label="New Password"
              required
              error={error || undefined}
              helperText="At least 8 characters for security"
            >
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                disabled={submitting}
                autoComplete="new-password"
              />
            </FormField>

            <FormField
              label="Confirm Password"
              required
              error={error ? error : undefined}
            >
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                disabled={submitting}
                autoComplete="new-password"
              />
            </FormField>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={submitting || !newPassword || !confirmPassword}
              className="w-full whitespace-normal text-center leading-tight py-3"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent shrink-0" />
                  <span>Updating password...</span>
                </>
              ) : (
                <span>Update password and continue</span>
              )}
            </Button>
          </form>

          {/* Logout Link */}
          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={() => {
                logout().then(() => navigate('/login', { replace: true }));
              }}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded px-2 py-1"
            >
              Log out instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
