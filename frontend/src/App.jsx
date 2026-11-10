import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { 
  apiGetCurrentUser, 
  apiLogout, 
  apiGetSummary, 
  apiGetProjects, 
  apiToggleStatus, 
  apiDeleteProject,
  apiGetAppSettings
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

// Modals
import FilamentCreateProjectModal from './components/modals/FilamentCreateProjectModal';
import FilamentProjectSimulatorModal from './components/modals/FilamentProjectSimulatorModal';
import FilamentPaymentModal from './components/modals/FilamentPaymentModal';
import FilamentWhatsAppModal from './components/modals/FilamentWhatsAppModal';
import FilamentEditNotesModal from './components/modals/FilamentEditNotesModal';
import FilamentEditProjectModal from './components/modals/FilamentEditProjectModal';
import FilamentDeleteConfirmModal from './components/modals/FilamentDeleteConfirmModal';

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

  // Active navigation tab & filter
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [viewMode, setViewMode] = useState(() => {
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
  const [detailProjectId, setDetailProjectId] = useState(null);
  const [previousTab, setPreviousTab] = useState('projects');

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

  useEffect(() => {
    fetchSettings();
  }, []);

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
  };

  // Synchronized Table Filter Change
  const handleFilterChange = (filterId) => {
    setCurrentFilter(filterId);
    setDetailProjectId(null);
    if (filterId === 'need_billing') {
      setActiveTab('receivables');
    } else if (filterId === 'need_payout') {
      setActiveTab('team');
    } else if (filterId === 'all' || filterId === 'settled') {
      setActiveTab('projects');
    }
  };

  const handleOpenDetail = (p) => {
    if (!p) return;
    const id = p.project_id || p.id;
    setDetailProjectId(id);
    setSelectedProject(p);
    setPreviousTab(activeTab === 'project-detail' ? 'projects' : activeTab);
    setActiveTab('project-detail');
  };

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
        setActiveTab(previousTab || 'projects');
        setDetailProjectId(null);
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
        />

        {/* Page Container - Tight padding and fluid width matching Image 2 */}
        <main className="w-full px-3.5 sm:px-5 lg:px-6 py-3 sm:py-4 space-y-3.5">
          
          {/* DEDICATED FULL-PAGE PROJECT DETAIL */}
          {activeTab === 'project-detail' && detailProjectId ? (
            <FilamentProjectDetailPage
              projectId={detailProjectId}
              onBack={() => {
                setActiveTab(previousTab || 'projects');
                setDetailProjectId(null);
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
                />
              )}

              {/* Filament Table Builder (Subkon Table for 'team', Projects Table for others) */}
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
