/**
 * Responsive Layout Component
 * Handles navigation, sidebar, and responsive layout for all pages
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, Settings, LogOut, Bell, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive, ResponsiveContainer } from '@/lib/responsive';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = true, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Mobile navigation items
  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Settings', icon: Settings, path: '/settings' },
    { label: 'Notifications', icon: Bell, path: '/notifications' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER - Responsive */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <ResponsiveContainer className="flex items-center justify-between py-3 sm:py-4">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
            )}
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
              {title || 'Swift Pay'}
            </h1>
          </div>

          {/* Desktop Navigation */}
          {isDesktop && (
            <nav className="hidden lg:flex items-center gap-6">
              {navItems.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  className={`text-sm font-medium transition ${
                    location.pathname === item.path
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <p className="text-xs sm:text-sm font-medium text-gray-900">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </ResponsiveContainer>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-col md:flex-row gap-0">
        {/* MOBILE SIDEBAR MENU - Dropdown style */}
        {isMobile && sidebarOpen && (
          <nav className="bg-white border-b border-gray-200 px-4 py-3 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        )}

        {/* DESKTOP SIDEBAR - Always visible on desktop */}
        {!isMobile && showSidebar && (
          <aside className="w-full md:w-56 lg:w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-80px)]">
            <nav className="p-4 sm:p-6 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.path}
                    href={item.path}
                    className={`flex items-center gap-3 px-4 py-2 sm:py-3 rounded-lg transition ${
                      location.pathname === item.path
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </a>
                );
              })}
            </nav>
          </aside>
        )}

        {/* PAGE CONTENT */}
        <main className="flex-1 min-h-[calc(100vh-80px)] bg-gray-50">
          <ResponsiveContainer className="py-4 sm:py-6 md:py-8">
            {children}
          </ResponsiveContainer>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION - Optional for mobile-heavy apps */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around z-40">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.path}
                href={item.path}
                className={`flex-1 flex flex-col items-center gap-1 px-2 py-3 transition ${
                  location.pathname === item.path
                    ? 'text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs text-center">{item.label}</span>
              </a>
            );
          })}
        </nav>
      )}
    </div>
  );
};

export default Layout;
