import React from 'react';
import { 
  ChevronLeft, 
  LogOut,
  ExternalLink
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
  currentUser,
  onLogout
}) {
  const isAdmin = currentUser?.role === 'ADMIN';

  const navGroups = [
    {
      groupTitle: 'MANAJEMEN KAS & PROYEK',
      items: [
        {
          id: 'dashboard',
          label: 'Ringkasan Kas',
          dotColor: 'bg-emerald-400 shadow-xs shadow-emerald-400/50',
          badge: 'KAS'
        },
        {
          id: 'projects',
          label: 'Daftar Proyek',
          dotColor: 'bg-blue-400 shadow-xs shadow-blue-400/50',
          badge: 'ALL'
        },
        {
          id: 'receivables',
          label: 'Piutang Klien',
          dotColor: 'bg-rose-400 shadow-xs shadow-rose-400/50',
          badge: 'TAGIH'
        },
        {
          id: 'team',
          label: 'Honor Tim Subkon',
          dotColor: 'bg-amber-400 shadow-xs shadow-amber-400/50',
          badge: 'TIM'
        },
        {
          id: 'ai-tracker',
          label: 'AI Payment Tracker',
          dotColor: 'bg-purple-400 shadow-xs shadow-purple-400/50',
          badge: 'AI'
        }
      ]
    },
    {
      groupTitle: 'ADMINISTRASI & SISTEM',
      items: [
        ...(isAdmin ? [
          {
            id: 'users',
            label: 'Manajemen Pengguna',
            dotColor: 'bg-cyan-400 shadow-xs shadow-cyan-400/50',
            badge: 'ADMIN'
          }
        ] : []),
        {
          id: 'export',
          label: 'Cetak Rekap PDF',
          dotColor: 'bg-slate-400',
          badge: 'PDF',
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
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 flex flex-col 
        bg-white dark:bg-[#070D18] border-r border-slate-200/80 dark:border-[#141F33] 
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Brand Header: Modern DevOps Console Brand */}
        {collapsed ? (
          <div className="h-16 flex items-center justify-center border-b border-slate-100 dark:border-[#141F33]">
            <button
              onClick={() => setCollapsed(false)}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center shadow-md shadow-blue-600/30 transition"
              title="Perluas Sidebar"
            >
              RK
            </button>
          </div>
        ) : (
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-[#141F33]">
            <div 
              className="flex items-center gap-3 overflow-hidden cursor-pointer" 
              onClick={() => onSelectTab('dashboard')}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 text-white font-black text-xs flex items-center justify-center shadow-md shadow-blue-600/25 shrink-0 tracking-tight">
                RK
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase truncate font-mono">
                    RAHMAT-KARYA
                  </h1>
                </div>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold truncate">
                  Auto-Engine v2.6 • 8080
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
        <div className={`flex-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'} py-3 space-y-4`}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              {!collapsed && (
                <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase font-mono">
                  {group.groupTitle}
                </div>
              )}
              {group.items.map((item) => {
                const isActive = activeTab === item.id;

                if (item.isExternal) {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center ${collapsed ? 'justify-center px-0 h-10' : 'gap-2.5 px-3 py-2'} rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0E1B30] hover:text-slate-900 dark:hover:text-white transition group`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className={`w-2 h-2 rounded-full ${item.dotColor} shrink-0`} />
                      {!collapsed && (
                        <>
                          <span className="truncate flex-1">{item.label}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#122038] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#1E304F]">
                            {item.badge}
                          </span>
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
                    className={`w-full flex items-center ${collapsed ? 'justify-center px-0 h-10' : 'gap-2.5 px-3 py-2'} rounded-xl text-xs transition text-left group relative ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 dark:bg-[#0E203C] dark:text-blue-400 dark:border dark:border-blue-500/30 font-bold shadow-2xs' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#0C1729] hover:text-slate-900 dark:hover:text-white font-medium'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={`w-2 h-2 rounded-full ${item.dotColor} shrink-0`} />
                    
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1">{item.label}</span>
                        {item.badge && (
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                            isActive
                              ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800'
                              : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-[#101E35] dark:text-slate-400 dark:border-[#1B2F52]'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Engine Architecture Status Box */}
        {!collapsed && (
          <div className="mx-3 mb-2 p-3 rounded-xl bg-slate-50 dark:bg-[#080E1B] border border-slate-200/80 dark:border-[#162540] text-[10px] font-mono space-y-1">
            <div className="font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              ENGINE ARCHITECTURE
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Mode:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Live Cash Active</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Database:</span>
              <span className="text-blue-600 dark:text-blue-400">MySQL Auto-Sync</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Engine:</span>
              <span className="text-amber-600 dark:text-amber-400">Rahmat-Karya v2.6</span>
            </div>
            <div className="pt-1.5 border-t border-slate-200/60 dark:border-[#162540] flex items-center justify-between text-[9px] text-slate-500">
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                System Online
              </span>
              <span>v2.6-pro</span>
            </div>
          </div>
        )}

        {/* User Footer Profile */}
        <div className={`p-3 border-t border-slate-100 dark:border-[#141F33] ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-2.5 ${collapsed ? 'p-1 justify-center' : 'p-2'} rounded-xl bg-slate-50 dark:bg-[#080E1B] border border-slate-200/80 dark:border-[#162540]`}>
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white dark:bg-blue-600 dark:text-white font-bold text-xs flex items-center justify-center shrink-0">
              {getInitials(currentUser?.name || 'Admin')}
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {currentUser?.role || 'ADMIN'}
                </div>
              </div>
            )}

            {!collapsed && (
              <button 
                onClick={onLogout}
                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
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
