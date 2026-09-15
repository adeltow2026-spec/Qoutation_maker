import React from 'react';
import { PageId } from './Sidebar';
import { Plus, Menu, PanelLeftOpen, PanelLeftClose, ChevronDown } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  currentPage: PageId;
  onNewQuotation: () => void;
  onOpenLibraryModal?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  currentUser?: UserProfile;
  onOpenUserModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNewQuotation,
  isSidebarOpen = true,
  onToggleSidebar,
  currentUser,
  onOpenUserModal,
}) => {
  const titles: Record<PageId, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Quotation Overview & Analytics',
      subtitle: 'Monitor quote statuses, draft pipelines, and sales activity',
    },
    new: {
      title: 'Create & Cost Quotation',
      subtitle: 'Build internal scope estimates with product library items and export client quotes',
    },
    quotations: {
      title: 'Quotations Directory',
      subtitle: 'Manage saved quotations, print client letterheads, or duplicate orders',
    },
    customers: {
      title: 'Customers Directory',
      subtitle: 'Manage client accounts, contact details, and tax registration numbers',
    },
    products: {
      title: 'Product & Item Library',
      subtitle: 'Manage standard raw materials, labor rates, and catalog pricing',
    },
    reports: {
      title: 'Reports & Export',
      subtitle: 'Analyze overall quoted volumes and export structured data backups',
    },
    settings: {
      title: 'Application & Letterhead Settings',
      subtitle: 'Configure default tax rates, overheads, markup percentages, and company letterhead',
    },
  };

  const { title, subtitle } = titles[currentPage] || titles.new;

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        {/* Toggle Sidebar Button (For Tablet, Mobile & Desktop fullscreen) */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarOpen ? 'Hide Sidebar (Expand View)' : 'Show Sidebar'}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center justify-center"
            aria-label="Toggle Navigation"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5 hidden lg:block text-slate-700" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 hidden lg:block text-blue-600" />
            )}
            <Menu className="w-5 h-5 lg:hidden text-slate-700" />
          </button>
        )}

        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {title}
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto sm:ml-0">
        {currentPage !== 'new' && (
          <button
            type="button"
            onClick={onNewQuotation}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Quotation</span>
            <span className="sm:hidden">New</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenUserModal}
          title="Manage user account and switch active estimator"
          className="flex items-center gap-2.5 pl-3 border-l border-slate-200 hover:bg-slate-50 p-1.5 rounded-lg transition-colors cursor-pointer text-left group"
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 border border-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
            {currentUser?.avatarInitials || currentUser?.name?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="hidden md:block">
            <div className="text-xs font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors flex items-center gap-1">
              {currentUser?.name || 'Adel'}
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-blue-500" />
            </div>
            <div className="text-[10px] text-slate-500">
              {currentUser?.role || 'Managing Estimator'}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};
