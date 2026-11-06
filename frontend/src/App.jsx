import React, { useState, useEffect, useCallback } from 'react';
import { 
  apiGetCurrentUser, 
  apiLogout, 
  apiGetSummary, 
  apiGetProjects, 
  apiToggleStatus, 
  apiDeleteProject 
} from './services/api';

import FilamentSidebar from './components/layout/FilamentSidebar';
import FilamentTopbar from './components/layout/FilamentTopbar';
import FilamentStatsOverview from './components/dashboard/FilamentStatsOverview';
import FilamentTable from './components/dashboard/FilamentTable';
import FilamentAiTracker from './components/dashboard/FilamentAiTracker';
import FilamentUserManagement from './components/users/FilamentUserManagement';
import FilamentLogin from './components/auth/FilamentLogin';
import FilamentNotification from './components/common/FilamentNotification';

// Modals
import FilamentCreateProjectModal from './components/modals/FilamentCreateProjectModal';
import FilamentPaymentModal from './components/modals/FilamentPaymentModal';
import FilamentWhatsAppModal from './components/modals/FilamentWhatsAppModal';
import FilamentDetailModal from './components/modals/FilamentDetailModal';
import FilamentEditNotesModal from './components/modals/FilamentEditNotesModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // App Theme: Default to Dark Ops/NOC Console, synchronized with 'procash_dark'
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('procash_dark');
    return saved !== null ? saved === 'true' : true;
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('fi_collapsed') === 'true';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Active navigation tab & filter
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentFilter, setCurrentFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');

  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // User permission check
  const canEdit = currentUser?.role !== 'VIEWER';

  // Toast Notification
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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
    if (filterId === 'need_billing') {
      setActiveTab('receivables');
    } else if (filterId === 'need_payout') {
      setActiveTab('team');
    } else if (filterId === 'all' || filterId === 'settled') {
      setActiveTab('projects');
    }
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
    if (projRes.success) setProjects(projRes.data);
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
        const input = document.querySelector('input[placeholder*="Cari"]');
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

  const handleDeleteProject = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus proyek ini?')) return;
    const res = await apiDeleteProject(id);
    if (res.success) {
      showToast(res.message);
      fetchData();
    } else {
      showToast(res.message, 'danger');
    }
  };

  // 1. Loading Splash Screen
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-black text-base flex items-center justify-center animate-bounce shadow-lg shadow-amber-500/20">
            RC
          </div>
          <span className="text-xs font-mono text-slate-400">Memuat Rekapitulasi Cashflow...</span>
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
        />

        {/* Page Container */}
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* USER MANAGEMENT PAGE */}
          {activeTab === 'users' ? (
            <FilamentUserManagement 
              currentUser={currentUser} 
              showToast={showToast} 
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
              onOpenDetail={(p) => {
                setSelectedProject(p);
                setDetailModalOpen(true);
              }}
              showToast={showToast}
            />
          ) : (
            <>
              {/* DASHBOARD & PROJECTS VIEW */}
              
              {/* Page Title & Synchronized Subtitle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeTab === 'receivables' 
                      ? 'Monitoring Piutang Klien' 
                      : activeTab === 'team' 
                      ? 'Plafon & Penyaluran Honor Tim Subkon' 
                      : activeTab === 'projects'
                      ? 'Daftar Semua Proyek'
                      : 'Rekapitulasi Cashflow Proyek'
                    }
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeTab === 'receivables' 
                      ? `Menampilkan ${projects.length} proyek dengan sisa tagihan terbuka yang belum diselesaikan klien`
                      : activeTab === 'team'
                      ? `Menampilkan ${projects.length} proyek dengan tanggungan honor vendor / subkon yang belum dibayarkan`
                      : activeTab === 'projects'
                      ? `Menampilkan seluruh ${projects.length} proyek aktif yang terdaftar dalam buku kas`
                      : 'Monitoring kas riil di tangan, tagihan terbuka, dan pembayaran subkon'
                    }
                  </p>
                </div>
              </div>

              {/* Filament Stats Overview Widget: Adaptif sesuai menu aktif (Daftar Proyek, Piutang, Honor Tim, Ringkasan Kas) */}
              <FilamentStatsOverview 
                summary={summary} 
                projects={projects} 
                activeTab={activeTab} 
              />

              {/* Filament Table Builder */}
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
                onOpenDetail={(p) => {
                  setSelectedProject(p);
                  setDetailModalOpen(true);
                }}
                onOpenPayment={(p) => {
                  setSelectedProject(p);
                  setPaymentModalOpen(true);
                }}
                onOpenTeamPayment={(p) => {
                  setSelectedProject(p);
                  setDetailModalOpen(true);
                }}
                onOpenWhatsApp={(p) => {
                  setSelectedProject(p);
                  setWhatsAppModalOpen(true);
                }}
                onOpenEditNotes={(p) => {
                  setSelectedProject(p);
                  setNotesModalOpen(true);
                }}
                onToggleStatus={handleToggleStatus}
                onDeleteProject={handleDeleteProject}
              />
            </>
          )}

        </main>
      </div>

      {/* ================================================================= */}
      {/* ACTION MODALS                                                     */}
      {/* ================================================================= */}
      <FilamentCreateProjectModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchData}
        showToast={showToast}
      />

      <FilamentPaymentModal
        isOpen={paymentModalOpen}
        project={selectedProject}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={fetchData}
        showToast={showToast}
      />

      <FilamentWhatsAppModal
        isOpen={whatsAppModalOpen}
        project={selectedProject}
        onClose={() => setWhatsAppModalOpen(false)}
        showToast={showToast}
      />

      <FilamentDetailModal
        isOpen={detailModalOpen}
        project={selectedProject}
        onClose={() => setDetailModalOpen(false)}
        onRefresh={fetchData}
        showToast={showToast}
        canEdit={canEdit}
        onOpenPayment={(p) => {
          setSelectedProject(p);
          setPaymentModalOpen(true);
        }}
        onOpenWhatsApp={(p) => {
          setSelectedProject(p);
          setWhatsAppModalOpen(true);
        }}
      />

      <FilamentEditNotesModal
        isOpen={notesModalOpen}
        project={selectedProject}
        onClose={() => setNotesModalOpen(false)}
        onSuccess={fetchData}
        showToast={showToast}
      />

    </div>
  );
}
