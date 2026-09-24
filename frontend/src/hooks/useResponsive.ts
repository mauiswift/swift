import { useState, useEffect } from 'react';

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,  // md
  desktop: 1024, // lg
};

export function useResponsive() {
  const getScreenSize = (): ScreenSize => {
    if (typeof window === 'undefined') return 'desktop';
    if (window.innerWidth < BREAKPOINTS.tablet) return 'mobile';
    if (window.innerWidth < BREAKPOINTS.desktop) return 'tablet';
    return 'desktop';
  };

  const [screenSize, setScreenSize] = useState<ScreenSize>(getScreenSize);

  useEffect(() => {
    const handleResize = () => {
      setScreenSize(getScreenSize());
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    screenSize,
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop',
    isMobileOrTablet: screenSize === 'mobile' || screenSize === 'tablet',
    isClient: true,
  };
}
