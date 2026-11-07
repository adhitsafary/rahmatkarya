import React from 'react';
import { 
  X, 
  LayoutDashboard, 
  FolderKanban, 
  Receipt, 
  Users, 
  Sparkles, 
  UserCog, 
  FileText,
  SlidersHorizontal,
  Layers
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
      groupTitle: 'MENU OPERASIONAL',
      icon: SlidersHorizontal,
      items: [
        {
          id: 'dashboard',
          label: 'Ringkasan Kas',
          tag: 'KAS',
          icon: LayoutDashboard
        },
        {
          id: 'projects',
          label: 'Daftar Semua Proyek',
          tag: 'PRO',
          icon: FolderKanban
        },
        {
          id: 'receivables',
          label: 'Piutang Klien',
          tag: 'PIUTANG',
          icon: Receipt
        },
        {
          id: 'team',
          label: 'Honor Tim Subkon',
          tag: 'SUBKON',
          icon: Users
        },
        {
          id: 'ai-tracker',
          label: 'Asisten AI Gemini',
          tag: 'GEMINI',
          icon: Sparkles
        }
      ]
    },
    {
      groupTitle: 'ADMINISTRASI',
      icon: Layers,
      items: [
        ...(isAdmin ? [
          {
            id: 'users',
            label: 'Manajemen Pengguna',
            tag: 'USERS',
            icon: UserCog
          }
        ] : []),
        {
          id: 'export',
          label: 'Cetak Rekap PDF',
          tag: 'PDF',
          icon: FileText,
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
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container - Sleek Modern Console Style */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 flex flex-col 
        bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Brand Header */}
        {collapsed ? (
          <div className="h-14 flex items-center justify-center border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCollapsed(false)}
              className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono font-black text-xs flex items-center justify-center shadow-xs cursor-pointer"
              title="Perluas Sidebar"
            >
              RK
            </button>
          </div>
        ) : (
          <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
            <div 
              className="flex items-center gap-2.5 overflow-hidden cursor-pointer" 
              onClick={() => onSelectTab('dashboard')}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                RK
              </div>
              <div className="min-w-0">
                <h1 className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">
                  RAHMAT-KARYA
                </h1>
                <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate">
                  Dompet Digital & Arus Kas
                </p>
              </div>
            </div>

            {/* Desktop Collapse Button */}
            <button 
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Ciutkan Sidebar"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Close Button */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Tutup Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <div className={`flex-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'} py-3 space-y-4`}>
          {navGroups.map((group, gIdx) => {
            const GroupIcon = group.icon;
            return (
              <div key={gIdx} className="space-y-1">
                {!collapsed && (
                  <div className="px-2.5 pb-1 flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    <span>{group.groupTitle}</span>
                    {GroupIcon && <GroupIcon className="w-3 h-3 text-slate-300 dark:text-slate-600" />}
                  </div>
                )}
                {group.items.map((item) => {
                  const isActive = activeTab === item.id || (activeTab === 'project-detail' && item.id === 'projects');
                  const Icon = item.icon;

                  if (item.isExternal) {
                    return (
                      <a
                        key={item.id}
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex items-center justify-between ${collapsed ? 'justify-center px-0 h-9' : 'px-2.5 py-2'} rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition group`}
                        title={collapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {Icon && (
                            <Icon className={`w-3.5 h-3.5 shrink-0 transition ${collapsed ? 'text-slate-500' : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'}`} />
                          )}
                          {!collapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                        </div>
                        {!collapsed && item.tag && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80">
                            {item.tag}
                          </span>
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
                      className={`w-full flex items-center justify-between ${collapsed ? 'justify-center px-0 h-9' : 'px-2.5 py-2'} rounded-xl text-xs transition cursor-pointer group ${
                        isActive 
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-xs' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {Icon && (
                          <Icon className={`w-3.5 h-3.5 shrink-0 transition ${
                            isActive 
                              ? 'text-white dark:text-slate-900' 
                              : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                          }`} />
                        )}
                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>
                      {!collapsed && item.tag && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider font-semibold transition ${
                          isActive 
                            ? 'bg-slate-800 text-slate-200 dark:bg-slate-200 dark:text-slate-900' 
                            : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80'
                        }`}>
                          {item.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* User Profile Footer */}
        <div className={`p-2.5 border-t border-slate-100 dark:border-slate-800 ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center gap-2.5 ${collapsed ? 'p-1 justify-center' : 'p-1.5'} rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800`}>
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs flex items-center justify-center shrink-0">
              {getInitials(currentUser?.name || 'Admin')}
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser?.name || 'Administrator'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize truncate">
                  {currentUser?.role?.toLowerCase() || 'admin'}
                </div>
              </div>
            )}

            {!collapsed && (
              <button 
                onClick={onLogout}
                className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                title="Keluar Akun"
              >
                Keluar
              </button>
            )}
          </div>
        </div>

      </aside>
    </>
  );
}