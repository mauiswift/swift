import React from 'react';

interface SiteContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function SiteContainer({ children, className = '' }: SiteContainerProps) {
  // Centralized container used across pages to ensure consistent width and horizontal padding
  return (
    <div className={`mx-auto w-full max-w-[1280px] px-6 md:px-12 lg:px-16 ${className}`}>
      {children}
    </div>
  );
}
