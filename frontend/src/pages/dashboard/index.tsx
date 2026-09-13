import ResponsiveRoute from '@/components/ResponsiveRoute';
import { useDashboardData, DashboardLoadingFallback } from './shared';
import DashboardDesktop from './Desktop';
import DashboardMobile from './Mobile';

export default function Dashboard() {
  const data = useDashboardData();
  const { authLoading, loading } = data;

  if (authLoading || loading) {
    return <DashboardLoadingFallback />;
  }

  return (
    <ResponsiveRoute
      desktopComponent={() => <DashboardDesktop {...data} />}
      mobileComponent={() => <DashboardMobile {...data} />}
    />
  );
}
