import { useEffect, useState } from 'react';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface MaintenanceStatus {
  is_active: boolean;
  message: string;
  started_at?: string;
  estimated_end_at?: string;
  can_access: boolean;
}

// Maintenance mode toggle - SET TO TRUE TO ENABLE
const MAINTENANCE_ENABLED = true;
const MAINTENANCE_PASSWORD = '#Kuyaden1216';

export default function MaintenancePage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Fetch maintenance status
  const { data: maintenanceData, isLoading } = useQuery({
    queryKey: ['maintenance-status'],
    queryFn: async () => {
      // If local maintenance is enabled, return mock data
      if (MAINTENANCE_ENABLED) {
        return {
          is_active: true,
          message: 'We are temporarily unavailable while we improve our service. We appreciate your patience!',
          started_at: new Date().toISOString(),
          estimated_end_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
          can_access: false,
        };
      }
      try {
        const response = await axios.get<MaintenanceStatus>('/api/maintenance/status');
        return response.data;
      } catch {
        return {
          is_active: false,
          message: 'System operational',
          can_access: true,
        };
      }
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Calculate time remaining
  useEffect(() => {
    if (!maintenanceData?.estimated_end_at) return;

    const timer = setInterval(() => {
      const now = new Date();
      const endTime = new Date(maintenanceData.estimated_end_at!);
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Estimated time passed');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [maintenanceData?.estimated_end_at]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === MAINTENANCE_PASSWORD) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Only admins and testers can access.');
    }
  };

  // Show password prompt if not authenticated and maintenance is active
  if (!authenticated && (MAINTENANCE_ENABLED || maintenanceData?.is_active)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Brand */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <img
                  src="/logo.svg"
                  alt="SwiftPay PH"
                  className="h-10 w-10 invert brightness-0"
                />
              </div>
            </div>
            <h1 className="text-3xl font-semibold text-white mb-2">SwiftPay PH</h1>
            <p className="text-slate-400">Admin Access Required</p>
          </div>

          {/* Password Form */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                  Enter Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-400">{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-lg transition duration-200 transform hover:scale-105"
              >
                Unlock
              </button>
            </form>

            <p className="text-xs text-slate-500 text-center mt-6">
              Admin and testers only. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show maintenance page if active and authenticated
  if (MAINTENANCE_ENABLED || maintenanceData?.is_active) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Main Content */}
          <div className="text-center mb-12">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
                <div className="relative h-20 w-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                  <img
                    src="/logo.svg"
                    alt="SwiftPay PH"
                    className="h-12 w-12 invert brightness-0"
                  />
                </div>
              </div>
            </div>

            {/* Brand Name */}
            <h1 className="text-5xl md:text-6xl font-semibold text-white mb-3 tracking-tight">
              SwiftPay<span className="text-green-400">PH</span>
            </h1>

            {/* Status Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full"></div>
                <div className="relative bg-yellow-500/10 border border-yellow-500/30 rounded-full p-4">
                  <Clock className="h-8 w-8 text-yellow-400 animate-spin" />
                </div>
              </div>
            </div>

            {/* Maintenance Message */}
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
              We're Under Maintenance
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              {maintenanceData?.message || 'We are temporarily unavailable while we improve our service.'}
            </p>

            {/* Estimated Time */}
            {timeRemaining && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-600/10 border border-green-500/30 rounded-xl p-6 mb-8 backdrop-blur">
                <p className="text-slate-300 mb-2">Estimated time remaining:</p>
                <p className="text-3xl font-semibold text-green-400">{timeRemaining}</p>
              </div>
            )}

            {/* What We're Doing */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-8 mb-8">
              <h3 className="text-lg font-semibold text-white mb-6">What we're working on:</h3>
              <div className="space-y-4">
                {[
                  'Enhancing security features',
                  'Improving system performance',
                  'Rolling out new features',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500/20 blur rounded-full"></div>
                      <CheckCircle className="relative h-5 w-5 text-green-400" />
                    </div>
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Info */}
            {authenticated && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8">
                <p className="text-blue-300 text-sm">
                  ✓ You are viewing this page as an admin/tester. Maintenance mode is currently <span className="font-semibold text-green-400">ACTIVE</span>.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center space-y-4">
            <p className="text-slate-400">
              Thank you for your patience. We'll be back online soon!
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-500">System Status: Maintenance</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 mx-auto mb-4 animate-pulse">
            <img
              src="/logo.svg"
              alt="SwiftPay PH"
              className="h-10 w-10 invert brightness-0"
            />
          </div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If not in maintenance mode, redirect or show nothing
  return null;
}
