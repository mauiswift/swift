import { useState, useEffect } from 'react';

export type ScreenSize = 'mobile' | 'tablet' | 'desktop';

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,  // md
  desktop: 1024, // lg
};

export function useResponsive() {
  const [screenSize, setScreenSize] = useState<ScreenSize>('desktop');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const handleResize = () => {
      const width = window.innerWidth;
      if (width < BREAKPOINTS.tablet) {
        setScreenSize('mobile');
      } else if (width < BREAKPOINTS.desktop) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    // Set initial size
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
    isClient,
  };
}
