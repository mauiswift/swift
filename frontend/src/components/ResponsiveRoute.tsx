import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import AppLoadingScreen from './AppLoadingScreen';

interface ResponsiveRouteProps {
  desktopComponent: React.ComponentType<any>;
  mobileComponent: React.ComponentType<any>;
  tabletComponent?: React.ComponentType<any>;
  componentProps?: Record<string, any>;
}

/**
 * Route wrapper that automatically displays device-specific components
 * Usage:
 * <Route path="/payment-approvals" element={
 *   <ResponsiveRoute
 *     desktopComponent={PaymentApprovalsDesktop}
 *     mobileComponent={PaymentApprovalsMobile}
 *   />
 * } />
 */
export default function ResponsiveRoute({
  desktopComponent: DesktopComponent,
  mobileComponent: MobileComponent,
  tabletComponent: TabletComponent,
  componentProps = {},
}: ResponsiveRouteProps) {
  const { screenSize, isClient } = useResponsive();

  if (!isClient) {
    return <AppLoadingScreen />;
  }

  const Component = screenSize === 'mobile'
    ? MobileComponent
    : screenSize === 'tablet' && TabletComponent
      ? TabletComponent
      : DesktopComponent;

  return <Component {...componentProps} />;
}
