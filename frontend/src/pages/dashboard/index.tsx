import ResponsiveRoute from '@/components/ResponsiveRoute';
import { useDashboardData } from './shared';
import DashboardDesktop from './Desktop';
import DashboardMobile from './Mobile';

export default function Dashboard() {
  const data = useDashboardData();

  return (
    <ResponsiveRoute
      desktopComponent={() => <DashboardDesktop {...data} />}
      mobileComponent={() => <DashboardMobile {...data} />}
    />
  );
}
