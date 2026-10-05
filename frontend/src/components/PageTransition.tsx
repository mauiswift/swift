import type { PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }: PropsWithChildren) {
  const { pathname } = useLocation();

  return (
    <div key={pathname} className="app-content app-motion flex-1">
      {children}
    </div>
  );
}
