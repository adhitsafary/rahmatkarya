import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Sun, 
  Moon, 
  Bell, 
  Plus, 
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
  onNewProject,
  canEdit = true
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const breadcrumbs = {
    dashboard: { title: 'RINGKASAN ARUS KAS', code: 'CASH-LIVE' },
    projects: { title: 'DAFTAR SEMUA PROYEK', code: 'PROYEK-ALL' },
    receivables: { title: 'MONITORING PIUTANG KLIEN', code: 'BILLING-DUE' },
    team: { title: 'PLAFON & HONOR TIM SUBKON', code: 'PAYOUT-TEAM' },
    'ai-tracker': { title: 'AI PAYMENT TRACKER & AUDIT', code: 'AUDIT-AI' },
    users: { title: 'MANAJEMEN PENGGUNA', code: 'USER-ADMIN' }
  };

  const current = breadcrumbs[activeTab] || { title: 'OPERATIONAL CONSOLE', code: 'PRO-2026' };

  return (
    <header className={`
      sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#070D18]/95 backdrop-blur-md 
      border-b border-slate-200/80 dark:border-[#141F33] transition-all duration-300
      ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}
    `}>
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        
        {/* Left: Mobile Toggle & Desktop Collapse & Current View Header */}
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
            className="hidden lg:flex p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={collapsed ? "Buka Sidebar" : "Ciutkan Sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>

          {/* DevOps Console Page Title */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="font-mono font-black text-xs text-slate-900 dark:text-white tracking-wider uppercase">
              {current.title}
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/80 dark:text-blue-400 dark:border-blue-800">
              {current.code}
            </span>
          </div>
        </div>

        {/* Center: Global Search Input */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama proyek, klien, kode SPK..."
              className="w-full text-xs font-mono rounded-xl pl-9 pr-14 py-2 bg-slate-50 dark:bg-[#0A1324] border border-slate-200/80 dark:border-[#182845] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <span className="absolute right-2.5 top-1.5 px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-[#122038] text-[10px] font-mono text-slate-400 dark:text-slate-500 border border-transparent dark:border-[#1E304F]">
              Ctrl+K
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Realtime Sync Status Pill (Like the NOC OLT sync badge) */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 text-[11px] font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sync: 100% Realtime</span>
          </div>

          {/* New Project Button (Like the blue Sync OLT button in screenshot) */}
          {canEdit ? (
            <button
              onClick={onNewProject}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-blue-600/30 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 font-bold" />
              <span className="hidden sm:inline">Proyek Baru</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs border border-slate-200 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span className="hidden sm:inline">Akses Lihat Saja</span>
            </span>
          )}

          {/* Dark / Light Mode Switcher */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 dark:border-[#162540] bg-white dark:bg-[#0A1324] hover:bg-slate-100 dark:hover:bg-[#101E35] transition text-sm shadow-2xs cursor-pointer"
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
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 dark:border-[#162540] bg-white dark:bg-[#0A1324] text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#101E35] transition shadow-2xs relative cursor-pointer"
              title="Notifikasi"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white dark:ring-[#070D18]" />
            </button>

            {/* Notification Dropdown */}
            {notificationsOpen && (
              <div 
                className="absolute right-0 top-11 w-72 bg-white dark:bg-[#0A1324] rounded-2xl shadow-xl border border-slate-200 dark:border-[#182845] p-3 z-50 text-xs"
                onClick={() => setNotificationsOpen(false)}
              >
                <div className="font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-[#182845]">
                  Sistem Notifikasi
                </div>
                <div className="py-3 text-slate-500 dark:text-slate-400 text-center text-xs font-mono">
                  Seluruh transaksi & termin sinkron.
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
