import React from 'react';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Users,
  Package,
  BarChart3,
  Settings,
  HardDrive,
  PanelLeftClose,
  X,
} from 'lucide-react';

import { UserProfile } from '../types';

export type PageId =
  | 'dashboard'
  | 'new'
  | 'quotations'
  | 'customers'
  | 'products'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isOpen: boolean;
  onClose: () => void;
  draftCount: number;
  quotesCount: number;
  productsCount: number;
  customersCount: number;
  logoUrl?: string;
  currentUser?: UserProfile;
  onOpenUserModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isOpen,
  onClose,
  draftCount,
  quotesCount,
  productsCount,
  customersCount,
  logoUrl,
  currentUser,
  onOpenUserModal,
}) => {
  const navItems = [
    {
      id: 'dashboard' as PageId,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'new' as PageId,
      label: 'New Quotation',
      icon: FilePlus,
      badge: draftCount > 0 ? 'Draft' : null,
      highlight: true,
    },
    {
      id: 'quotations' as PageId,
      label: 'Quotations',
      icon: FileText,
      badge: quotesCount > 0 ? String(quotesCount) : null,
    },
    {
      id: 'customers' as PageId,
      label: 'Customers',
      icon: Users,
      badge: customersCount > 0 ? String(customersCount) : null,
    },
    {
      id: 'products' as PageId,
      label: 'Product Library',
      icon: Package,
      badge: productsCount > 0 ? String(productsCount) : null,
    },
    {
      id: 'reports' as PageId,
      label: 'Reports',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'settings' as PageId,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile/Tablet Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#0a192f] text-slate-200 flex flex-col flex-shrink-0 border-r border-slate-800 select-none transition-all duration-300 ease-in-out ${
          isOpen
            ? 'translate-x-0 lg:ml-0 shadow-2xl lg:shadow-none'
            : '-translate-x-full lg:-ml-64 shadow-none'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-lg shadow-black/20 flex-shrink-0 border border-slate-700">
                <img
                  src={logoUrl}
                  alt="Touch Of Wood"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-700 to-amber-950 flex flex-col items-center justify-center text-amber-100 shadow-lg shadow-amber-950/40 border border-amber-600/40 font-black text-xs flex-shrink-0">
                <span>TOW</span>
              </div>
            )}
            <div>
              <div className="font-extrabold text-sm tracking-wide text-white flex items-center gap-1.5 leading-tight">
                Touch Of Wood
              </div>
              <p className="text-[10px] text-amber-400 font-medium leading-tight mt-0.5">Decoration Works LLC</p>
            </div>
          </div>

          {/* Close / Hide Button */}
          <button
            type="button"
            onClick={onClose}
            title="Hide Sidebar"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-5 h-5 hidden lg:block" />
            <X className="w-5 h-5 lg:hidden" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  // Auto-close on small screens upon navigation for smooth experience
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badge === 'Draft'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User / Estimator Profile Card */}
        <div className="p-3 border-t border-slate-800 bg-[#071324]/90">
          <button
            type="button"
            onClick={() => {
              if (onOpenUserModal) onOpenUserModal();
              if (window.innerWidth < 1024) onClose();
            }}
            title="Manage estimator profile & team"
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0 group-hover:ring-2 group-hover:ring-blue-400 transition-all">
                {currentUser?.avatarInitials || currentUser?.name?.slice(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                  {currentUser?.name || 'Adel'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {currentUser?.role || 'Managing Estimator'}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-blue-400 bg-blue-900/40 border border-blue-700/50 px-1.5 py-0.5 rounded flex-shrink-0">
              User
            </span>
          </button>
        </div>

        {/* Storage and System Info */}
        <div className="p-4 border-t border-slate-800/80 bg-[#071324] text-[11px] text-slate-400 space-y-2">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" /> Storage Engine
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">ACTIVE</span>
          </div>
          <p className="text-[10px] leading-relaxed text-slate-400">
            Auto-saves locally with backup export &amp; shared quotation generator.
          </p>
        </div>
      </aside>
    </>
  );
};
