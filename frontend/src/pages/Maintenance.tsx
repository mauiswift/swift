import { useEffect, useState } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';

// Backend response format
interface BackendMaintenanceStatus {
  maintenance_mode: boolean;
}

// Internal format
interface MaintenanceStatus {
  is_active: boolean;
  message?: string;
  started_at?: string;
  estimated_end_at?: string;
}

export default function MaintenancePage() {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Fetch maintenance status from backend API
  const { data: maintenanceData, isLoading } = useQuery({
    queryKey: ['maintenance-status'],
    queryFn: async () => {
      try {
        const res = await client.apiCall.invoke({
          url: '/api/v1/app-settings/maintenance',
          method: 'GET',
          data: {},
        });
        if (res.ok && res.data) {
          const backendData = res.data as BackendMaintenanceStatus;
          return {
            is_active: backendData.maintenance_mode ?? false,
            message: 'We are temporarily unavailable while we improve our service.',
          } as MaintenanceStatus;
        }
        return { is_active: false, message: 'System operational' };
      } catch (err) {
        console.error('Failed to fetch maintenance status:', err);
        return { is_active: false, message: 'System operational' };
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

  // Show maintenance page if active
  if (maintenanceData?.is_active) {
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

  // If not in maintenance mode, return null (page is not shown)
  return null;
}
