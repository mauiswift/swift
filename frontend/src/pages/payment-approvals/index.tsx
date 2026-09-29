import ResponsiveRoute from '@/components/ResponsiveRoute';
import Desktop from './Desktop';
import Mobile from './Mobile';

/**
 * Payment Approval page with separate desktop and mobile routes
 * Automatically renders the appropriate component based on device size
 */
export default function SuperAdminPaymentApproval() {
  return (
    <ResponsiveRoute
      desktopComponent={Desktop}
      mobileComponent={Mobile}
      tabletComponent={Mobile}
    />
  );
}
