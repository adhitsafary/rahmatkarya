import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Sun, 
  Moon, 
  Bell, 
  Plus, 
  ChevronRight,
  PanelLeftOpen,
  PanelLeftClose
} from 'lucide-react';

export default function FilamentTopbar({
  collapsed,
  setCollapsed,
  setSidebarOpen,
  activeTab,
  isDarkMode,
  setIsDarkMode,
  searchQuery,
  setSearchQuery,
  currentUser,
  onLogout,
  onNewProject,
  canEdit = true
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const breadcrumbs = {
    dashboard: 'Ringkasan Kas',
    projects: 'Daftar Proyek',
    receivables: 'Piutang Klien',
    team: 'Honor Tim Subkon',
    'ai-tracker': 'AI Payment Tracker',
    users: 'Manajemen Pengguna'
  };

  return (
    <header className={`
      sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md 
      border-b border-slate-200/80 dark:border-slate-800 transition-all duration-300
      ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}
    `}>
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        
        {/* Left: Mobile Toggle & Desktop Collapse & Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Mobile Hamburger Toggle */}
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Sidebar Toggle Icon */}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={collapsed ? "Buka Sidebar" : "Ciutkan Sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* Breadcrumb Navigation */}
          <nav className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Kas & Proyek</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
            <span className="font-bold text-slate-900 dark:text-white">
              {breadcrumbs[activeTab] || 'Dashboard'}
            </span>
          </nav>
        </div>

        {/* Center: Global Search Input */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama proyek, klien, SPK..."
              className="w-full text-xs font-medium rounded-xl pl-9 pr-14 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <span className="absolute right-2.5 top-1.5 px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-[10px] font-mono text-slate-400">
              Ctrl+K
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* New Project Button or Read-Only Indicator */}
          {canEdit ? (
            <button
              onClick={onNewProject}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 active:scale-95 font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4 font-bold" />
              <span className="hidden sm:inline">Proyek Baru</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs border border-slate-200 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="hidden sm:inline">Akses Lihat Saja</span>
              <span className="sm:hidden">Viewer</span>
            </span>
          )}

          {/* Dark / Light Mode Switcher */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm shadow-xs"
            title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            )}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-xs relative"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-slate-900 dark:bg-white ring-2 ring-white dark:ring-slate-900" />
            </button>

            {/* Notification Dropdown */}
            {notificationsOpen && (
              <div 
                className="absolute right-0 top-11 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 text-xs"
                onClick={() => setNotificationsOpen(false)}
              >
                <div className="font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
                  Notifikasi Sistem
                </div>
                <div className="py-3 text-slate-500 dark:text-slate-400 text-center text-xs">
                  Semua transaksi dan termin tercatat rapi.
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
