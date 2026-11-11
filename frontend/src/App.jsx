import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { 
  apiGetCurrentUser, 
  apiLogout, 
  apiGetSummary, 
  apiGetProjects, 
  apiToggleStatus, 
  apiDeleteProject,
  apiGetAppSettings,
  apiGetDailyNotifications
} from './services/api';

import FilamentSidebar from './components/layout/FilamentSidebar';
import FilamentTopbar from './components/layout/FilamentTopbar';
import FilamentStatsOverview from './components/dashboard/FilamentStatsOverview';
import FilamentCashflowAnalytics from './components/dashboard/FilamentCashflowAnalytics';
import FilamentTable from './components/dashboard/FilamentTable';
import FilamentSubkonTable from './components/dashboard/FilamentSubkonTable';
import FilamentAiTracker from './components/dashboard/FilamentAiTracker';
import FilamentProjectDetailPage from './components/dashboard/FilamentProjectDetailPage';
import FilamentUserManagement from './components/users/FilamentUserManagement';
import FilamentSettings from './components/settings/FilamentSettings';
import FilamentLogin from './components/auth/FilamentLogin';
import FilamentNotification from './components/common/FilamentNotification';
import ErrorBoundary from './components/common/ErrorBoundary';

// Modals
import FilamentCreateProjectModal from './components/modals/FilamentCreateProjectModal';
import FilamentDailyBriefingModal from './components/modals/FilamentDailyBriefingModal';
import FilamentProjectSimulatorModal from './components/modals/FilamentProjectSimulatorModal';
import FilamentPaymentModal from './components/modals/FilamentPaymentModal';
import FilamentWhatsAppModal from './components/modals/FilamentWhatsAppModal';
import FilamentEditNotesModal from './components/modals/FilamentEditNotesModal';
import FilamentEditProjectModal from './components/modals/FilamentEditProjectModal';
import FilamentDeleteConfirmModal from './components/modals/FilamentDeleteConfirmModal';

const VALID_TABS = ['dashboard', 'projects', 'receivables', 'team', 'ai-tracker', 'users', 'settings'];

function parseHashLocation() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (!hash) return null;

  // Check project detail pattern: project/123 or project-detail?id=123 or project-detail/123
  const projectMatch = hash.match(/^project(?:-detail)?(?:\/|\?id=)([a-zA-Z0-9_-]+)/);
  if (projectMatch) {
    return {
      tab: 'project-detail',
      projectId: projectMatch[1]
    };
  }

  const cleanTab = hash.split('?')[0].split('/')[0];
  if (VALID_TABS.includes(cleanTab)) {
    return {
      tab: cleanTab,
      projectId: null
    };
  }

  return null;
}

function getInitialNavigation() {
  const fromHash = parseHashLocation();
  if (fromHash) {
    return fromHash;
  }

  try {
    const saved = localStorage.getItem('procash_active_tab');
    if (saved) {
      if (saved.startsWith('project:') || saved.startsWith('project/')) {
        const pId = saved.split(/[:/]/)[1];
        if (pId) {
          return { tab: 'project-detail', projectId: pId };
        }
      }
      if (VALID_TABS.includes(saved)) {
        return { tab: saved, projectId: null };
      }
    }
  } catch (e) {
    // ignore
  }

  return { tab: 'dashboard', projectId: null };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // App Theme: Default to Light Mode (Clean Minimalist SaaS 2026)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('procash_dark');
    return saved !== null ? saved === 'true' : false;
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('fi_collapsed') === 'true';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Active navigation tab & filter (persisted on page reload & synced with browser history)
  const initialNav = getInitialNavigation();
  const [activeTab, setActiveTab] = useState(initialNav.tab);
  const [detailProjectId, setDetailProjectId] = useState(initialNav.projectId);
  const [currentFilter, setCurrentFilter] = useState(() => {
    if (initialNav.tab === 'receivables') return 'need_billing';
    if (initialNav.tab === 'team') return 'need_payout';
    return 'all';
  });
  const [selectedWorkflowStage, setSelectedWorkflowStage] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('procash_view_mode');
    if (saved) return saved;
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'grid';
    }
    return 'list';
  });
  const [searchQuery, setSearchQuery] = useState('');

  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [simulatorModalOpen, setSimulatorModalOpen] = useState(false);
  const [simulatorPrefill, setSimulatorPrefill] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [detailRefreshTrigger, setDetailRefreshTrigger] = useState(0);
  const [previousTab, setPreviousTab] = useState('projects');

  const [dailyBriefingOpen, setDailyBriefingOpen] = useState(false);
  const [dailyNotifData, setDailyNotifData] = useState(null);

  // User permission check
  const canEdit = currentUser?.role !== 'VIEWER';

  // Toast Notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [appSettings, setAppSettings] = useState(null);

  const fetchSettings = async () => {
    try {
      const res = await apiGetAppSettings();
      if (res.success && res.data) {
        setAppSettings(res.data);
      }
    } catch {
      // ignore
    }
  };

  const fetchDailyNotifs = async () => {
    try {
      const res = await apiGetDailyNotifications();
      if (res.success && res.data) {
        setDailyNotifData(res.data);
        // Automatically open daily briefing if user hasn't seen/dismissed it today
        const todayStr = new Date().toISOString().slice(0, 10);
        const dismissedToday = localStorage.getItem('procash_briefing_dismissed_date') === todayStr;
        const autoEnabled = appSettings?.notif_auto_briefing !== '0';
        if (!dismissedToday && autoEnabled && res.data.summary?.total_alerts > 0) {
          setTimeout(() => {
            setDailyBriefingOpen(true);
          }, 900);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Dynamically sync browser tab Title and Favicon
  useEffect(() => {
    if (appSettings?.company_name) {
      document.title = `${appSettings.company_name} - Arus Kas & Manajemen Proyek`;
    }

    const applyFavicon = (href, type = 'image/png') => {
      // Remove all old icon links to force Chrome/browser tab repaint
      const existing = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
      existing.forEach(el => el.remove());

      const icon = document.createElement('link');
      icon.rel = 'icon';
      if (type) icon.type = type;
      icon.href = href;
      document.head.appendChild(icon);

      const shortcut = document.createElement('link');
      shortcut.rel = 'shortcut icon';
      if (type) shortcut.type = type;
      shortcut.href = href;
      document.head.appendChild(shortcut);

      const apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      apple.href = href;
      document.head.appendChild(apple);
    };

    if (appSettings?.company_logo) {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 64;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, 64, 64);
            const maxDim = Math.max(img.width, img.height);
            const scale = 64 / maxDim;
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (64 - w) / 2;
            const y = (64 - h) / 2;
            ctx.drawImage(img, x, y, w, h);
            const pngDataUrl = canvas.toDataURL('image/png');
            applyFavicon(pngDataUrl, 'image/png');
            return;
          }
        } catch {
          // fallback
        }
        applyFavicon(appSettings.company_logo, 'image/png');
      };
      img.onerror = () => {
        applyFavicon('./favicon-32x32.png?v=' + Date.now(), 'image/png');
      };
      img.src = appSettings.company_logo;
    } else {
      applyFavicon('./favicon-32x32.png?v=3', 'image/png');
    }
  }, [appSettings]);

  useEffect(() => {
    if (currentUser) {
      fetchDailyNotifs();
    }
  }, [currentUser]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // Sync dark mode with root HTML & body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('procash_dark', isDarkMode ? 'true' : 'false');
  }, [isDarkMode]);

  // Listen to external theme changes across tabs/pages
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'procash_dark') {
        setIsDarkMode(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('fi_collapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  // Check initial authentication
  const checkAuth = async () => {
    const res = await apiGetCurrentUser();
    if (res.success && res.data) {
      setCurrentUser(res.data);
    } else {
      setCurrentUser(null);
    }
    setAuthChecked(true);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Synchronized Tab Change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setDetailProjectId(null);
    if (tabId === 'receivables') {
      setCurrentFilter('need_billing');
    } else if (tabId === 'team') {
      setCurrentFilter('need_payout');
    } else if (tabId === 'projects') {
      setCurrentFilter('all');
    } else if (tabId === 'dashboard') {
      setCurrentFilter('all');
    }

    const targetHash = tabId === 'dashboard' ? '#dashboard' : `#${tabId}`;
    try {
      localStorage.setItem('procash_active_tab', tabId);
    } catch (e) {}
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
  };

  // Synchronized Table Filter Change
  const handleFilterChange = (filterId) => {
    setCurrentFilter(filterId);
    setDetailProjectId(null);
    let targetTab = activeTab;
    if (filterId === 'need_billing') {
      targetTab = 'receivables';
      setActiveTab('receivables');
    } else if (filterId === 'need_payout') {
      targetTab = 'team';
      setActiveTab('team');
    } else if (filterId === 'all' || filterId === 'settled') {
      targetTab = 'projects';
      setActiveTab('projects');
    }

    const targetHash = targetTab === 'dashboard' ? '#dashboard' : `#${targetTab}`;
    try {
      localStorage.setItem('procash_active_tab', targetTab);
    } catch (e) {}
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
  };

  const handleOpenDetail = (p) => {
    if (!p) return;
    const id = p.project_id || p.id;
    setDetailProjectId(id);
    setSelectedProject(p);
    setPreviousTab(activeTab === 'project-detail' ? 'projects' : activeTab);
    setActiveTab('project-detail');

    const targetHash = `#project/${id}`;
    try {
      localStorage.setItem('procash_active_tab', `project/${id}`);
    } catch (e) {}
    if (window.location.hash !== targetHash) {
      window.history.pushState(null, '', targetHash);
    }
  };

  // Listen to browser Back / Forward buttons (popstate & hashchange)
  useEffect(() => {
    const handlePopState = () => {
      const nav = parseHashLocation();
      if (nav) {
        if (nav.tab === 'project-detail') {
          setDetailProjectId(nav.projectId);
          setActiveTab('project-detail');
        } else {
          setActiveTab(nav.tab);
          setDetailProjectId(null);
          if (nav.tab === 'receivables') {
            setCurrentFilter('need_billing');
          } else if (nav.tab === 'team') {
            setCurrentFilter('need_payout');
          } else if (nav.tab === 'projects' || nav.tab === 'dashboard') {
            setCurrentFilter('all');
          }
        }
      } else {
        setActiveTab('dashboard');
        setDetailProjectId(null);
        setCurrentFilter('all');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Sync URL hash with current view on mount / reload
  useEffect(() => {
    if (!authChecked || !currentUser) return;

    let targetHash = '';
    let storageVal = activeTab;

    if (activeTab === 'project-detail' && detailProjectId) {
      targetHash = `#project/${detailProjectId}`;
      storageVal = `project/${detailProjectId}`;
    } else if (VALID_TABS.includes(activeTab)) {
      targetHash = activeTab === 'dashboard' ? '#dashboard' : `#${activeTab}`;
      storageVal = activeTab;
    }

    if (targetHash) {
      try {
        localStorage.setItem('procash_active_tab', storageVal);
      } catch (e) {}

      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', targetHash);
      }
    }
  }, [activeTab, detailProjectId, authChecked, currentUser]);

  // Persist View Mode (grid / list)
  useEffect(() => {
    try {
      localStorage.setItem('procash_view_mode', viewMode);
    } catch (e) {}
  }, [viewMode]);

  // Fetch Dashboard & Projects Data
  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);

    let appliedFilter = currentFilter;
    if (activeTab === 'receivables') appliedFilter = 'need_billing';
    if (activeTab === 'team') appliedFilter = 'need_payout';

    const [sumRes, projRes] = await Promise.all([
      apiGetSummary(),
      apiGetProjects(appliedFilter, searchQuery)
    ]);

    if (sumRes.success) setSummary(sumRes.data);
    if (projRes.success) {
      setProjects(projRes.data);
      setSelectedProject((prev) => {
        if (!prev && detailProjectId) {
          const found = projRes.data.find((p) => String(p.project_id || p.id) === String(detailProjectId));
          return found || null;
        }
        if (!prev) return null;
        const prevId = prev.project_id || prev.id;
        const found = projRes.data.find((p) => (p.project_id || p.id) === prevId);
        return found ? { ...prev, ...found } : prev;
      });
    }
    setLoading(false);
  }, [currentUser, activeTab, currentFilter, searchQuery]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, activeTab, currentFilter, searchQuery, fetchData]);

  // Global Ctrl + K search focus shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.getElementById('global-search-input') || 
                      document.querySelector('input[placeholder*="Search"]') || 
                      document.querySelector('input[placeholder*="Cari"]');
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('procash_active_tab');
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch (e) {}
    await apiLogout();
    setCurrentUser(null);
  };

  const handleToggleStatus = async (id, status) => {
    const res = await apiToggleStatus(id, status);
    if (res.success) {
      showToast(res.message);
      fetchData();
    } else {
      showToast(res.message, 'danger');
    }
  };

  const handleOpenEditProject = (project) => {
    setProjectToEdit(project);
    setEditProjectModalOpen(true);
  };

  const handleOpenDeleteProject = (project) => {
    setProjectToDelete(project);
    setDeleteConfirmModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    if (selectedProject && projectToDelete && ((selectedProject.project_id || selectedProject.id) === (projectToDelete.project_id || projectToDelete.id))) {
      setDetailModalOpen(false);
      setSelectedProject(null);
      if (activeTab === 'project-detail') {
        const returnTab = previousTab && previousTab !== 'project-detail' ? previousTab : 'projects';
        handleTabChange(returnTab);
      }
    }
    fetchData();
  };

  const handleEditSuccess = () => {
    fetchData();
    setDetailRefreshTrigger((t) => t + 1);
  };

  const handleDeleteProject = async (id) => {
    const proj = projects.find(p => (p.project_id || p.id) === id);
    if (proj) {
      handleOpenDeleteProject(proj);
    } else {
      if (!confirm('Apakah Anda yakin ingin menghapus proyek ini?')) return;
      const res = await apiDeleteProject(id);
      if (res.success) {
        showToast(res.message);
        fetchData();
      } else {
        showToast(res.message, 'danger');
      }
    }
  };

  // 1. Loading Splash Screen
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono font-black text-sm flex items-center justify-center shadow-sm">
            RK
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Memuat Arus Kas & Manajemen Proyek...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated -> Filament Login Screen
  if (!currentUser) {
    return (
      <>
        <FilamentLogin
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            fetchData();
          }}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          showToast={showToast}
          appSettings={appSettings}
        />
        <FilamentNotification toast={toast} onClose={() => setToast({ ...toast, show: false })} />
      </>
    );
  }

  // 3. Authenticated -> Full Filament 3 Admin Panel
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060D1A] text-slate-800 dark:text-slate-100 transition-colors antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Toast Notification */}
      <FilamentNotification toast={toast} onClose={() => setToast({ ...toast, show: false })} />

      {/* Filament Collapsible Sidebar */}
      <FilamentSidebar
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        summary={summary}
        currentUser={currentUser}
        onLogout={handleLogout}
        appSettings={appSettings}
        dailyNotifData={dailyNotifData}
        onOpenDailyBriefing={() => setDailyBriefingOpen(true)}
      />

      {/* Main Panel Content Area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        
        {/* Filament Topbar */}
        <FilamentTopbar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          currentUser={currentUser}
          canEdit={canEdit}
          onLogout={handleLogout}
          onNewProject={() => setCreateModalOpen(true)}
          onOpenSimulator={() => setSimulatorModalOpen(true)}
          onOpenDailyBriefing={() => setDailyBriefingOpen(true)}
          onOpenPayment={(p) => {
            setSelectedProject(p);
            setPaymentModalOpen(true);
          }}
          onOpenWhatsApp={(p) => {
            setSelectedProject(p);
            setWhatsAppModalOpen(true);
          }}
          onOpenDetail={handleOpenDetail}
          onSelectTab={handleTabChange}
          showToast={showToast}
        />

        {/* Page Container - Tight padding and fluid width matching Image 2 */}
        <main className="w-full px-3.5 sm:px-5 lg:px-6 py-3 sm:py-4 space-y-3.5">
          
          {/* DEDICATED FULL-PAGE PROJECT DETAIL */}
          {activeTab === 'project-detail' && detailProjectId ? (
            <ErrorBoundary 
              onReset={() => setDetailRefreshTrigger(t => t + 1)} 
              onGoHome={() => handleTabChange('projects')}
            >
              <FilamentProjectDetailPage
                projectId={detailProjectId}
                onBack={() => {
                  const returnTab = previousTab && previousTab !== 'project-detail' ? previousTab : 'projects';
                  handleTabChange(returnTab);
                }}
                onOpenPayment={(p) => {
                  setSelectedProject(p);
                  setPaymentModalOpen(true);
                }}
                onOpenWhatsApp={(p) => {
                  setSelectedProject(p);
                  setWhatsAppModalOpen(true);
                }}
                onOpenEdit={(p) => {
                  handleOpenEditProject(p);
                }}
                onOpenDelete={(p) => {
                  handleOpenDeleteProject(p);
                }}
                canEdit={canEdit}
                showToast={showToast}
                refreshTrigger={detailRefreshTrigger}
              />
            </ErrorBoundary>
          ) : activeTab === 'users' ? (
            <FilamentUserManagement 
              currentUser={currentUser} 
              showToast={showToast} 
            />
          ) : activeTab === 'settings' ? (
            <FilamentSettings
              currentUser={currentUser}
              showToast={showToast}
              onSettingsUpdated={(newSettings) => setAppSettings(newSettings)}
            />
          ) : activeTab === 'ai-tracker' ? (
            <FilamentAiTracker
              projects={projects}
              onOpenWhatsApp={(p) => {
                setSelectedProject(p);
                setWhatsAppModalOpen(true);
              }}
              onOpenPayment={(p) => {
                setSelectedProject(p);
                setPaymentModalOpen(true);
              }}
              onOpenDetail={handleOpenDetail}
              showToast={showToast}
            />
          ) : (
            <>
              {/* DASHBOARD & PROJECTS VIEW */}
              
              {/* Page Title & Context Header matching Image 2 layout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {activeTab === 'receivables' 
                        ? 'MONITORING PIUTANG KLIEN' 
                        : activeTab === 'team' 
                        ? 'HONOR TIM & BEBAN SUBKON' 
                        : activeTab === 'projects'
                        ? 'DAFTAR SEMUA PROYEK'
                        : 'REKAPITULASI CASHFLOW PROYEK'
                      }
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {activeTab === 'receivables' ? 'PIUTANG' : activeTab === 'team' ? 'SUBKON' : activeTab === 'projects' ? 'SEMUA-PROYEK' : 'KAS-UTAMA'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <button
                    onClick={() => {
                      fetchData();
                      showToast('Buku kas berhasil disinkronkan.');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1.5"
                    title="Sinkronisasi Arus Kas Sekarang"
                  >
                    <span>Sinkron Kas</span>
                  </button>

                  {canEdit && (
                    <button
                      onClick={() => setCreateModalOpen(true)}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5"
                      title="Tambah Proyek Baru"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Proyek Baru</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filament Stats Overview Widget: Adaptif sesuai menu aktif (Daftar Proyek, Piutang, Honor Tim, Ringkasan Kas) */}
              <FilamentStatsOverview 
                summary={summary} 
                projects={projects} 
                activeTab={activeTab} 
              />

              {/* Interactive Cashflow & Visual Analytics Hub for Ringkasan Kas */}
              {activeTab === 'dashboard' && (
                <FilamentCashflowAnalytics
                  projects={projects}
                  summary={summary}
                  onOpenDetail={handleOpenDetail}
                  onOpenPayment={(p) => {
                    setSelectedProject(p);
                    setPaymentModalOpen(true);
                  }}
                  onOpenWhatsApp={(p) => {
                    setSelectedProject(p);
                    setWhatsAppModalOpen(true);
                  }}
                  onOpenSimulator={() => setSimulatorModalOpen(true)}
                  selectedWorkflowStage={selectedWorkflowStage}
                  onSelectWorkflowStage={setSelectedWorkflowStage}
                />
              )}

              {/* Filament Table Builder (Subkon Table for 'team', Projects Table for others) */}
              <ErrorBoundary onReset={fetchData} onGoHome={() => { setViewMode('list'); setActiveTab('dashboard'); }}>
                {activeTab === 'team' ? (
                  <FilamentSubkonTable
                    projects={projects}
                    currentUser={currentUser}
                    canEdit={canEdit}
                    onOpenDetail={handleOpenDetail}
                    showToast={showToast}
                  />
                ) : (
                  <FilamentTable
                    projects={projects}
                    loading={loading}
                    currentFilter={currentFilter}
                    setFilter={handleFilterChange}
                    selectedWorkflowStage={selectedWorkflowStage}
                    onClearWorkflowStage={() => setSelectedWorkflowStage(null)}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    canEdit={canEdit}
                    currentUser={currentUser}
                    onOpenDetail={handleOpenDetail}
                    onOpenPayment={(p) => {
                      setSelectedProject(p);
                      setPaymentModalOpen(true);
                    }}
                    onOpenTeamPayment={handleOpenDetail}
                    onOpenWhatsApp={(p) => {
                      setSelectedProject(p);
                      setWhatsAppModalOpen(true);
                    }}
                    onOpenEditNotes={(p) => {
                      setSelectedProject(p);
                      setNotesModalOpen(true);
                    }}
                    onToggleStatus={handleToggleStatus}
                    onOpenEditProject={handleOpenEditProject}
                    onDeleteProject={handleOpenDeleteProject}
                    onRefresh={fetchData}
                    showToast={showToast}
                  />
                )}
              </ErrorBoundary>
            </>
          )}

        </main>
      </div>

      {/* ================================================================= */}
      {/* ACTION MODALS                                                     */}
      {/* ================================================================= */}
      <FilamentCreateProjectModal
        isOpen={createModalOpen}
        initialData={simulatorPrefill}
        onClose={() => {
          setCreateModalOpen(false);
          setSimulatorPrefill(null);
        }}
        onSuccess={fetchData}
        showToast={showToast}
      />

      <FilamentDailyBriefingModal
        isOpen={dailyBriefingOpen}
        onClose={() => setDailyBriefingOpen(false)}
        data={dailyNotifData}
        onOpenWhatsApp={(p) => {
          setSelectedProject(p);
          setWhatsAppModalOpen(true);
        }}
        onOpenPayment={(p) => {
          setSelectedProject(p);
          setPaymentModalOpen(true);
        }}
        onOpenDetail={handleOpenDetail}
        onSelectTab={handleTabChange}
        appSettings={appSettings}
      />

      <FilamentProjectSimulatorModal
        isOpen={simulatorModalOpen}
        onClose={() => setSimulatorModalOpen(false)}
        onApplyToNewProject={(prefill) => {
          setSimulatorPrefill(prefill);
          setCreateModalOpen(true);
        }}
        showToast={showToast}
      />

      <FilamentPaymentModal
        isOpen={paymentModalOpen}
        project={selectedProject}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={() => {
          fetchData();
          setDetailRefreshTrigger((t) => t + 1);
        }}
        showToast={showToast}
      />

      <FilamentWhatsAppModal
        isOpen={whatsAppModalOpen}
        project={selectedProject}
        onClose={() => setWhatsAppModalOpen(false)}
        showToast={showToast}
        appSettings={appSettings}
      />

      <FilamentEditProjectModal
        isOpen={editProjectModalOpen}
        project={projectToEdit}
        onClose={() => {
          setEditProjectModalOpen(false);
          setProjectToEdit(null);
        }}
        onSuccess={handleEditSuccess}
        showToast={showToast}
      />

      <FilamentDeleteConfirmModal
        isOpen={deleteConfirmModalOpen}
        project={projectToDelete}
        onClose={() => {
          setDeleteConfirmModalOpen(false);
          setProjectToDelete(null);
        }}
        onSuccess={handleDeleteSuccess}
        showToast={showToast}
      />

      <FilamentEditNotesModal
        isOpen={notesModalOpen}
        project={selectedProject}
        onClose={() => setNotesModalOpen(false)}
        onSuccess={() => {
          fetchData();
          setDetailRefreshTrigger((t) => t + 1);
        }}
        showToast={showToast}
      />

    </div>
  );
}
