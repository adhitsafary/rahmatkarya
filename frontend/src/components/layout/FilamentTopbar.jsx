import React, { useState } from 'react';
import { Menu, Sun, Moon, Plus, Search, SlidersHorizontal, X, Calculator } from 'lucide-react';

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
  onOpenSimulator,
  canEdit = true
}) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const titles = {
    dashboard: 'Ringkasan Kas',
    projects: 'Daftar Proyek',
    receivables: 'Piutang Klien',
    team: 'Honor Tim Subkon',
    'ai-tracker': 'Asisten AI Gemini',
    users: 'Manajemen Pengguna',
    settings: 'Pengaturan Sistem',
    'project-detail': 'Rincian Proyek'
  };

  const currentTitle = titles[activeTab] || 'Arus Kas';

  return (
    <header className="sticky top-0 z-30 h-13 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="h-full px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* If mobile search is open, show search bar across topbar on mobile */}
        {mobileSearchOpen ? (
          <div className="flex sm:hidden items-center w-full gap-2">
            <div className="relative flex-1">
              <input
                id="global-search-input-mobile"
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by project name, client, SPK..."
                className="w-full text-xs rounded-xl pl-8 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-sans"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        ) : (
          <>
            {/* Left: Mobile Toggle & Sidebar Collapse & Current Header */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center shrink-0"
                title="Buka Menu Navigasi"
                aria-label="Buka Menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Desktop Sidebar Toggle Button */}
              <button 
                onClick={() => setCollapsed(!collapsed)}
                className="hidden lg:flex p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                title={collapsed ? "Buka Sidebar" : "Ciutkan Sidebar"}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              {/* Current Page Title */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight truncate max-w-[140px] sm:max-w-xs md:max-w-none">
                  {currentTitle}
                </span>
              </div>
            </div>

            {/* Right Actions: Search Input, Proyek Baru, Theme Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              
              {/* Mobile Search Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileSearchOpen(true)}
                className="sm:hidden p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center justify-center shrink-0"
                title="Cari Proyek"
                aria-label="Cari Proyek"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              {/* Global Clean Search Input - Positioned on the right next to + Proyek Baru */}
              <div className="relative hidden sm:block w-48 md:w-60 lg:w-72 xl:w-80">
                <input
                  id="global-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by project name, client, SPK..."
                  className="w-full text-xs rounded-xl pl-8 pr-12 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition font-sans"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer p-0.5"
                    title="Hapus pencarian"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="absolute right-2 top-1 px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-700 text-[10px] font-mono text-slate-500 dark:text-slate-400 pointer-events-none">
                    Ctrl+K
                  </span>
                )}
              </div>

              {/* Project Simulator Button */}
              <button
                type="button"
                onClick={onOpenSimulator}
                className="inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded-xl shadow-2xs transition cursor-pointer shrink-0"
                title="Kalkulator & Simulasi Termin SPK"
              >
                <Calculator className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden md:inline">Simulasi SPK</span>
              </button>

              {/* New Project Button */}
              {canEdit ? (
                <button
                  onClick={onNewProject}
                  className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-xs px-2.5 sm:px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer shrink-0"
                  title="Buat Proyek Baru"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Proyek Baru</span>
                  <span className="sm:hidden text-xs">Proyek</span>
                </button>
              ) : (
                <span className="hidden sm:inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-xs border border-slate-200 dark:border-slate-700 shrink-0">
                  Read-Only
                </span>
              )}

              {/* Light / Dark Mode Toggle Icon Button */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 sm:px-2 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center justify-center shrink-0"
                title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                aria-label="Toggle Mode Gelap/Terang"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
              </button>
            </div>
          </>
        )}

      </div>
    </header>
  );
}