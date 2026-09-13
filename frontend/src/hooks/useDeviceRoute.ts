import { useMemo } from 'react';
import { useResponsive, type ScreenSize } from './useResponsive';

/**
 * Hook for rendering device-specific components
 * Usage:
 * const Component = useDeviceRoute({
 *   mobile: MobilePaymentApproval,
 *   tablet: TabletPaymentApproval,  // optional
 *   desktop: DesktopPaymentApproval,
 * });
 * return <Component {...props} />;
 */
export function useDeviceRoute({
  mobile,
  tablet,
  desktop,
}: {
  mobile: React.ComponentType<any>;
  tablet?: React.ComponentType<any>;
  desktop: React.ComponentType<any>;
}): React.ComponentType<any> {
  const { screenSize } = useResponsive();

  return useMemo(() => {
    if (screenSize === 'mobile') return mobile;
    if (screenSize === 'tablet' && tablet) return tablet;
    return desktop;
  }, [screenSize, mobile, tablet, desktop]);
}
