import React from 'react';
import { responsiveContainer, responsivePadding } from '../../lib/responsive';

export function Container({ children }: { children: React.ReactNode }) {
  return <div className={`${responsiveContainer} mx-auto ${responsivePadding.container} py-10`}>{children}</div>;
}

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl md:text-4xl font-semibold text-foreground">{title}</h1>
      {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell min-h-screen bg-background text-foreground">
      {/* content-frame provides isolation for decorative backgrounds and masked overlays */}
      <div className="content-frame relative">
        {/* Decorative floating background elements (subtle, non-interactive) */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-8%] top-8 w-80 h-80 rounded-full bg-gradient-to-tr from-orange-500/10 to-blue-500/8 blur-3xl animate-float" />
          <div className="absolute right-[-6%] bottom-12 w-96 h-96 rounded-full bg-gradient-to-bl from-blue-500/8 to-orange-400/6 blur-2xl animate-float-delayed" />
        </div>

        <Container>{children}</Container>
      </div>
    </div>
  );
}
