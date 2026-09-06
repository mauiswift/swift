import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const SESSION_TIMEOUT_MINUTES = 30; // Match backend setting
const WARNING_BEFORE_LOGOUT_MINUTES = 5; // Show warning 5 minutes before logout
const INACTIVITY_CHECK_INTERVAL = 60000; // Check every 60 seconds

/**
 * Hook for automatic logout on session timeout due to inactivity.
 * Should be used in a component inside Router, not in a provider.
 * 
 * Usage:
 * ```tsx
 * function DashboardWrapper() {
 *   useAutoLogout();
 *   return <Dashboard />;
 * }
 * ```
 */
export function useAutoLogout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const lastActivityRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef<boolean>(false);
  const handleActivityRef = useRef<(() => void) | null>(null);
  const listenersAttachedRef = useRef<boolean>(false);

  const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;
  const WARNING_TIME_MS = WARNING_BEFORE_LOGOUT_MINUTES * 60 * 1000;

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/login', { replace: true, state: { sessionExpired: true } });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login', { replace: true, state: { sessionExpired: true } });
    }
  }, [logout, navigate]);

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false; // Reset warning flag on activity
  }, []);

  useEffect(() => {
    if (user) {
      updateActivity();
    }
  }, [user, updateActivity]);

  const checkTimeout = useCallback(() => {
    if (!user) return;

    const timeSinceLastActivity = Date.now() - lastActivityRef.current;

    // Show warning if approaching timeout and hasn't been shown yet
    if (
      timeSinceLastActivity > SESSION_TIMEOUT_MS - WARNING_TIME_MS &&
      timeSinceLastActivity < SESSION_TIMEOUT_MS &&
      !warningShownRef.current
    ) {
      warningShownRef.current = true;
      const remainingMinutes = Math.ceil((SESSION_TIMEOUT_MS - timeSinceLastActivity) / 60000);
      toast.warning(`Your session will expire in ${remainingMinutes} minute(s) due to inactivity.`);
    }

    // Logout if timeout exceeded
    if (timeSinceLastActivity > SESSION_TIMEOUT_MS) {
      handleLogout();
    }
  }, [user, SESSION_TIMEOUT_MS, WARNING_TIME_MS, handleLogout]);

  // Setup activity listeners - only when user is logged in
  useEffect(() => {
    if (!user) {
      // Clean up listeners if user logs out
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (handleActivityRef.current && listenersAttachedRef.current) {
        const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        activityEvents.forEach((event) => {
          window.removeEventListener(event, handleActivityRef.current as EventListener, true);
        });
        listenersAttachedRef.current = false;
      }
      return;
    }

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Create stable reference to handler function ONLY once
    if (!handleActivityRef.current) {
      handleActivityRef.current = () => {
        updateActivity();
      };
    }

    // Only attach listeners once
    if (!listenersAttachedRef.current) {
      activityEvents.forEach((event) => {
        window.addEventListener(event, handleActivityRef.current as EventListener, true);
      });
      listenersAttachedRef.current = true;
    }

    // Setup timeout check interval
    if (!timeoutRef.current) {
      timeoutRef.current = setInterval(checkTimeout, INACTIVITY_CHECK_INTERVAL);
    }

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivityRef.current as EventListener, true);
      });
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
      listenersAttachedRef.current = false;
    };
  }, [user, updateActivity, checkTimeout]);
}
