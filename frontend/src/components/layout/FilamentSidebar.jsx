import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  DollarSign, 
  Users, 
  UserCheck, 
  Printer, 
  ChevronLeft, 
  LogOut,
  ExternalLink,
  Bot
} from 'lucide-react';
import { getInitials } from '../../utils/format';
import { getEndpoint } from '../../services/api';

export default function FilamentSidebar({
  activeTab,
  onSelectTab,
  sidebarOpen,
  setSidebarOpen,
  collapsed,
  setCollapsed,
  summary,
  currentUser,
  onLogout
}) {
  const isAdmin = currentUser?.role === 'ADMIN';

  const navGroups = [
    {
      groupTitle: 'KAS & PROYEK',
      items: [
        {
          id: 'dashboard',
          label: 'Ringkasan Kas',
          icon: LayoutDashboard
        },
        {
          id: 'projects',
          label: 'Daftar Proyek',
          icon: FolderKanban
        },
        {
          id: 'receivables',
          label: 'Piutang Klien',
          icon: DollarSign
        },
        {
          id: 'team',
          label: 'Honor Tim Subkon',
          icon: Users
        },
        {
          id: 'ai-tracker',
          label: 'AI Payment Tracker',
          icon: Bot
        }
      ]
    },
    {
      groupTitle: 'SISTEM',
      items: [
        ...(isAdmin ? [
          {
            id: 'users',
            label: 'Manajemen Pengguna',
            icon: UserCheck
          }
        ] : []),
        {
          id: 'export',
          label: 'Cetak Rekap PDF',
          icon: Printer,
          isExternal: true,
          href: getEndpoint('export.php?id=1')
        }
      ]
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 flex flex-col 
        bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Brand Header: Clean Minimalist Rahmat-Karya */}
        {collapsed ? (
          <div className="h-16 flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCollapsed(false)}
              className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center shadow-xs hover:opacity-90 transition"
              title="Perluas Sidebar"
            >
              RK
            </button>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
            <div 
              className="flex items-center gap-3 overflow-hidden cursor-pointer" 
              onClick={() => onSelectTab('dashboard')}
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center shadow-xs shrink-0 tracking-tight">
                RK
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">
                    Rahmat-Karya
                  </h1>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    ADMIN
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate">
                  Rekapitulasi Kas & Proyek
                </p>
              </div>
            </div>

            {/* Collapse Button */}
            <button 
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Ciutkan Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <div className={`flex-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'} py-4 space-y-5`}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {group.groupTitle}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                if (item.isExternal) {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center ${collapsed ? 'justify-center px-0 h-10' : 'gap-3 px-3 py-2'} rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition group`}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="truncate flex-1">{item.label}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </>
                      )}
                    </a>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center ${collapsed ? 'justify-center px-0 h-10' : 'gap-3 px-3 py-2'} rounded-xl text-xs font-semibold transition text-left group relative ${
                      isActive 
                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    {isActive && (
                      <span className={`absolute ${collapsed ? 'left-1' : 'left-0'} top-1/2 -translate-y-1/2 w-1 h-5 bg-slate-900 dark:bg-white rounded-r`} />
                    )}
                    <Icon className={`w-4 h-4 shrink-0 transition ${
                      isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                    }`} />
                    
                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* User Footer Profile */}
        <div className={`p-3 border-t border-slate-100 dark:border-slate-800 ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-2.5 ${collapsed ? 'p-1 justify-center' : 'p-2'} rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800`}>
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xs flex items-center justify-center shrink-0">
              {getInitials(currentUser?.name || 'Admin')}
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-slate-400">
                  {currentUser?.role || 'ADMIN'}
                </div>
              </div>
            )}

            {!collapsed && (
              <button 
                onClick={onLogout}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                title="Keluar Akun"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </aside>
    </>
  );
}
