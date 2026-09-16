/**
 * Responsive Design System for Swift Pay
 * Comprehensive system for mobile-first, responsive layouts
 */

import React from 'react';

/* ============================================
   BREAKPOINTS
   ============================================ */
export const breakpoints = {
  xs: 320,    // Extra small phones
  sm: 640,    // Small phones landscape
  md: 768,    // Tablets
  lg: 1024,   // Desktop
  xl: 1280,   // Large desktop
  xxl: 1536,  // Extra large desktop
};

export const breakpointNames = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;
export type BreakpointName = typeof breakpointNames[number];

/* ============================================
   RESPONSIVE HOOK
   ============================================ */
export const useResponsive = () => {
  const [windowSize, setWindowSize] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  React.useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { width } = windowSize;

  return {
    width,
    isXs: width < breakpoints.sm,
    isSm: width >= breakpoints.sm && width < breakpoints.md,
    isMd: width >= breakpoints.md && width < breakpoints.lg,
    isLg: width >= breakpoints.lg && width < breakpoints.xl,
    isXl: width >= breakpoints.xl && width < breakpoints.xxl,
    isXxl: width >= breakpoints.xxl,
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    isLargeScreen: width >= breakpoints.xl,
  };
};

/* ============================================
   RESPONSIVE CONTAINER COMPONENT
   ============================================ */
export const ResponsiveContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <div className={`w-full px-3 sm:px-6 md:px-8 lg:px-0 ${className}`}>
    <div className="max-w-7xl mx-auto">{children}</div>
  </div>
);

/* ============================================
   RESPONSIVE GRID COMPONENT
   ============================================ */
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'small' | 'medium' | 'large';
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { xs: 1, sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'medium',
  className = '',
}) => {
  const gapMap = {
    small: 'gap-2 sm:gap-3 md:gap-4',
    medium: 'gap-4 sm:gap-5 md:gap-6 lg:gap-8',
    large: 'gap-6 sm:gap-8 md:gap-10 lg:gap-12',
  };

  const gridClass = `grid grid-cols-${cols.xs || 1} sm:grid-cols-${cols.sm || 1} md:grid-cols-${cols.md || 2} lg:grid-cols-${cols.lg || 3} xl:grid-cols-${cols.xl || 4} ${gapMap[gap]} ${className}`;

  return <div className={gridClass}>{children}</div>;
};

/* ============================================
   RESPONSIVE FLEX COMPONENT
   ============================================ */
interface ResponsiveFlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'column' | 'responsive'; // responsive = column on mobile, row on desktop
  justify?: 'start' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'center' | 'end' | 'stretch';
  gap?: 'small' | 'medium' | 'large';
  wrap?: boolean;
  className?: string;
}

export const ResponsiveFlex: React.FC<ResponsiveFlexProps> = ({
  children,
  direction = 'responsive',
  justify = 'start',
  align = 'stretch',
  gap = 'medium',
  wrap = true,
  className = '',
}) => {
  const directionMap = {
    row: 'flex-row',
    column: 'flex-col',
    responsive: 'flex-col md:flex-row',
  };

  const justifyMap = {
    start: 'justify-start',
    center: 'justify-center',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  const alignMap = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const gapMap = {
    small: 'gap-2 sm:gap-3',
    medium: 'gap-4 sm:gap-6',
    large: 'gap-6 sm:gap-8',
  };

  return (
    <div
      className={`flex ${directionMap[direction]} ${justifyMap[justify]} ${alignMap[align]} ${gapMap[gap]} ${wrap ? 'flex-wrap' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

/* ============================================
   RESPONSIVE TEXT COMPONENTS
   ============================================ */
export const ResponsiveHeading1: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold ${className}`}>
    {children}
  </h1>
);

export const ResponsiveHeading2: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <h2 className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold ${className}`}>
    {children}
  </h2>
);

export const ResponsiveHeading3: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <h3 className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold ${className}`}>
    {children}
  </h3>
);

export const ResponsiveBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <p className={`text-sm sm:text-base md:text-lg leading-relaxed ${className}`}>
    {children}
  </p>
);

export const ResponsiveSmall: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => (
  <span className={`text-xs sm:text-sm md:text-base ${className}`}>
    {children}
  </span>
);

/* ============================================
   RESPONSIVE PADDING/SPACING UTILITIES
   ============================================ */
export const responsivePadding = {
  container: 'px-4 sm:px-6 md:px-8 lg:px-10 py-4 sm:py-6 md:py-8 lg:py-10',
  section: 'px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 lg:py-12',
  card: 'p-4 sm:p-5 md:p-6 lg:p-8',
  small: 'p-2 sm:p-3 md:p-4',
  large: 'p-6 sm:p-8 md:p-10 lg:p-12',
};

/* ============================================
   RESPONSIVE SIDEBAR LAYOUT
   ============================================ */
interface ResponsiveSidebarLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  sidebarPosition?: 'left' | 'right';
  sidebarWidth?: 'narrow' | 'normal' | 'wide';
  className?: string;
}

export const ResponsiveSidebarLayout: React.FC<ResponsiveSidebarLayoutProps> = ({
  children,
  sidebar,
  sidebarPosition = 'right',
  sidebarWidth = 'normal',
  className = '',
}) => {
  const sidebarWidthMap = {
    narrow: 'md:w-1/4',
    normal: 'md:w-1/3',
    wide: 'md:w-2/5',
  };

  const isRightSidebar = sidebarPosition === 'right';

  return (
    <div className={`flex flex-col ${isRightSidebar ? 'md:flex-row-reverse' : 'md:flex-row'} gap-4 md:gap-6 lg:gap-8 ${className}`}>
      <div className="w-full md:flex-1">{children}</div>
      <aside className={`w-full ${sidebarWidthMap[sidebarWidth]}`}>{sidebar}</aside>
    </div>
  );
};

/* ============================================
   RESPONSIVE MODAL/DRAWER
   ============================================ */
interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'small' | 'medium' | 'large';
}

export const ResponsiveModal: React.FC<ResponsiveModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  size = 'medium',
}) => {
  if (!isOpen) return null;

  const sizeMap = {
    small: 'max-w-sm',
    medium: 'max-w-md md:max-w-lg',
    large: 'max-w-lg md:max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className={`bg-white rounded-lg shadow-lg ${sizeMap[size]} w-full max-h-[90vh] overflow-y-auto`}>
        {title && (
          <div className="sticky top-0 bg-white border-b p-4 sm:p-6 flex justify-between items-center">
            <h2 className="text-lg sm:text-xl font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
};

/* ============================================
   RESPONSIVE TAB NAVIGATION
   ============================================ */
interface ResponsiveTabsProps {
  tabs: Array<{ label: string; id: string; content: React.ReactNode }>;
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

export const ResponsiveTabs: React.FC<ResponsiveTabsProps> = ({
  tabs,
  defaultTab,
  onChange,
}) => {
  const [activeTab, setActiveTab] = React.useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 sm:gap-4 border-b overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-4 sm:mt-6">
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};
