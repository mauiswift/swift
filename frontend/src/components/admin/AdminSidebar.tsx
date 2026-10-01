import React, { useState } from 'react';
import { ChevronDown, LogOut, Settings, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { AdminTab } from './adminManagementTabs';

interface NavSection {
  title: string;
  color: string;
  icon: React.ReactNode;
  tabs: Array<{
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    description: string;
  }>;
}

interface AdminSidebarProps {
  sections: NavSection[];
  selectedTab: AdminTab;
  onTabSelect: (tab: AdminTab) => void;
}

export function AdminSidebar({ sections, selectedTab, onTabSelect }: AdminSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections.map(s => s.title))
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleSection = (title: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    setExpandedSections(newExpanded);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Logo/Header */}
      <div className="px-6 py-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white">Swift Admin</h1>
        <p className="text-xs text-slate-400 mt-1">Banking Control Center</p>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
        {sections.map((section) => (
          <div key={section.title}>
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white uppercase tracking-wider transition-colors group"
            >
              <div className="flex items-center gap-2">
                <div className={`w-1 h-1 rounded-full ${section.color}`}></div>
                {section.title}
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedSections.has(section.title) ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Section Tabs */}
            {expandedSections.has(section.title) && (
              <div className="space-y-1 mt-2 ml-2">
                {section.tabs.map((tab) => {
                  const isActive = selectedTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onTabSelect(tab.id);
                        setMobileOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                        isActive
                          ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={tab.description}
                    >
                      <span
                        className={`flex-shrink-0 w-5 h-5 ${
                          isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      >
                        {tab.icon}
                      </span>
                      <span className="flex-1 text-left truncate">{tab.label}</span>
                      {isActive && (
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-800 p-4 space-y-2">
        <div className="px-3 py-2 rounded-lg bg-slate-800/50">
          <p className="text-xs text-slate-400">Logged in as</p>
          <p className="text-sm font-semibold text-white truncate">{user?.email || 'Admin'}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 z-40 transform transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}
    </>
  );
}
