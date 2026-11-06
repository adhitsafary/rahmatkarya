<?php
// =====================================================================
// FINANCIAL DASHBOARD: Rekapitulasi Cashflow (PRO VAULT)
// =====================================================================
require_once __DIR__ . '/auth.php';
checkAuth();
$currentUser = getCurrentUser();
$canEdit = canEdit();
?>
<!DOCTYPE html>
<html lang="id" x-data="procashApp()" :class="{ 'dark': isDarkMode }" x-init="initApp()">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Rekapitulasi Cashflow - Modern Freelance Financial Tracker</title>
    <!-- Tailwind CSS with Dark Mode Class Strategy -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        fintech: {
                            base: '#F8FAFC',
                            card: '#FFFFFF',
                            border: '#E2E8F0',
                            accent: '#2563EB',
                            dark: '#0F172A',
                            emerald: '#059669',
                            rose: '#E11D48',
                            amber: '#D97706'
                        }
                    },
                    boxShadow: {
                        'fintech': '0 4px 24px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
                        'fintech-hover': '0 12px 32px -4px rgba(15, 23, 42, 0.09), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
                        'hero': '0 20px 40px -15px rgba(37, 99, 235, 0.15)',
                    }
                }
            }
        }
    </script>
    <!-- Alpine.js CDN -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
    <!-- Google Fonts: Plus Jakarta Sans & JetBrains Mono -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { 
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-tap-highlight-color: transparent;
        }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        [x-cloak] { display: none !important; }

        /* Smooth iOS Momentum Scrolling */
        .smooth-scroll {
            -webkit-overflow-scrolling: touch;
        }

        /* Sleek Modern Scrollbar */
        ::-webkit-scrollbar {
            height: 6px;
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: transparent;
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 9999px;
        }
        .dark ::-webkit-scrollbar-thumb {
            background: #334155;
        }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 min-h-screen antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200">

    <!-- Toast Notification (Floating Pill) -->
    <div x-cloak x-show="toast.show" 
         x-transition:enter="transition ease-out duration-300"
         x-transition:enter-start="opacity-0 transform translate-y-4 scale-95"
         x-transition:enter-end="opacity-100 transform translate-y-0 scale-100"
         x-transition:leave="transition ease-in duration-200"
         x-transition:leave-start="opacity-100 transform translate-y-0 scale-100"
         x-transition:leave-end="opacity-0 transform translate-y-4 scale-95"
         class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl text-xs sm:text-sm font-bold border backdrop-blur-md"
         :class="toast.isError ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30' : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/30 dark:bg-white dark:text-slate-900'">
        <span x-text="toast.isError ? 'ERR' : 'OK'" class="text-[9px] font-black px-1.5 py-0.5 rounded" :class="toast.isError ? 'bg-white/20 text-white' : 'bg-emerald-500 text-white'"></span>
        <span x-text="toast.message"></span>
    </div>

    <!-- App Shell Container (Sidebar + Content) -->
    <div class="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
        
        <!-- ============================================================= -->
        <!-- 1. MODERN COLLAPSIBLE SIDEBAR (Clean Minimalist SaaS)          -->
        <!-- ============================================================= -->
        
        <!-- Mobile Backdrop -->
        <div x-cloak x-show="sidebarOpen" @click="sidebarOpen = false"
             x-transition:enter="transition-opacity ease-linear duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition-opacity ease-linear duration-300"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"></div>

        <!-- Sidebar Aside -->
        <aside :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
               class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shrink-0 shadow-lg lg:shadow-none">
            
            <!-- Top Branding & Navigation -->
            <div class="flex-1 flex flex-col min-h-0">
                
                <!-- Brand Header -->
                <div class="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 shadow-md shadow-blue-500/20 flex items-center justify-center text-white font-black text-sm">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <rect width="20" height="14" x="2" y="5" rx="2"/>
                                <line x1="2" x2="22" y1="10" y2="10"/>
                            </svg>
                        </div>
                        <div>
                            <div class="flex items-center gap-1.5">
                                <span class="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">ProCash</span>
                                <span class="px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 font-extrabold text-[9px] tracking-wide">FINTECH</span>
                            </div>
                            <span class="text-[10px] text-slate-400 block font-medium">Digital Cashflow Vault</span>
                        </div>
                    </div>

                    <!-- Mobile Close Button -->
                    <button @click="sidebarOpen = false" class="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <!-- Scrollable Navigation Items -->
                <nav class="flex-1 p-3.5 space-y-5 overflow-y-auto smooth-scroll text-xs">
                    
                    <!-- GROUP 1: KAS & PROYEK -->
                    <div class="space-y-1">
                        <span class="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Kas & Proyek</span>
                        
                        <a href="client.php" target="_blank"
                           class="flex items-center justify-between px-3 py-2 rounded-xl font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 transition">
                            <div class="flex items-center gap-2.5">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                <span>Dashboard Client</span>
                            </div>
                            <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-black bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200">PORTAL</span>
                        </a>

                        <a href="#hero-section" @click="sidebarOpen = false"
                           class="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 transition">
                            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                            <span>Ringkasan Kas</span>
                        </a>

                        <a href="#proyek-section" @click="sidebarOpen = false"
                           class="flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition">
                            <div class="flex items-center gap-3">
                                <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/></svg>
                                <span>Daftar Proyek</span>
                            </div>
                            <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-mono font-bold" x-text="projects.length"></span>
                        </a>
                    </div>

                    <!-- GROUP 2: AI TRACKER -->
                    <div class="space-y-1">
                        <span class="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">AI Tracker Hub</span>
                        
                        <button @click="openAiTrackerModal(); sidebarOpen = false;"
                                class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/50 transition text-left">
                            <div class="flex items-center gap-3">
                                <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                <span>AI Cashflow Audit</span>
                            </div>
                            <template x-if="aiAnalysis && aiAnalysis.counts && aiAnalysis.counts.total_anomalies > 0">
                                <span class="px-1.5 py-0.5 rounded-full text-[9px] bg-indigo-600 text-white font-mono font-bold" x-text="aiAnalysis.counts.total_anomalies"></span>
                            </template>
                        </button>

                        <button @click="openAiTrackerModal(); aiTrackerTab = 'gemini'; sidebarOpen = false;"
                                class="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition text-left">
                            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                            <span>Tanya AI Gemini</span>
                        </button>

                        <button @click="openAiTrackerModal(); aiTrackerTab = 'simulator'; sidebarOpen = false;"
                                class="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition text-left">
                            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                            <span>Simulator Transaksi</span>
                        </button>
                    </div>

                    <!-- GROUP 3: PENCATATAN & LAPORAN -->
                    <div class="space-y-1">
                        <span class="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Pencatatan & Laporan</span>
                        
                        <?php if ($canEdit): ?>
                        <button @click="openCreateModal(); sidebarOpen = false;"
                                class="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 transition text-left">
                            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                            <span>Tambah Proyek Baru</span>
                        </button>
                        <button @click="openQuickPaymentModal(); sidebarOpen = false;"
                                class="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50 transition text-left">
                            <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                            <span>Catat Pemasukan</span>
                        </button>
                        <button @click="openQuickTeamModal(); sidebarOpen = false;"
                                class="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/50 transition text-left">
                            <svg class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                            <span>Bayar Honor Tim</span>
                        </button>
                        <?php endif; ?>

                        <a href="Blueprint_Ringkasan_Aplikasi_ProCash.pdf" target="_blank"
                           class="flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition">
                            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                            <span>Blueprint PDF Klien</span>
                        </a>

                        <a href="export.php?id=1" target="_blank"
                           class="flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition">
                            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                            <span>Cetak Rekap Kas</span>
                        </a>
                    </div>

                    <!-- GROUP 4: SISTEM -->
                    <div class="space-y-1">
                        <span class="px-3 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Sistem</span>

                        <a href="panel/"
                           class="flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 transition">
                            <div class="flex items-center gap-2.5">
                                <svg class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                <span>React Filament Panel</span>
                            </div>
                            <span class="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900 text-amber-900 dark:text-amber-200">PRO</span>
                        </a>

                        <?php if (($currentUser['role'] ?? '') === 'ADMIN'): ?>
                        <a href="users.php"
                           class="flex items-center gap-3 px-3 py-2 rounded-xl font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition">
                            <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                            <span>Manajemen Pengguna</span>
                        </a>
                        <?php endif; ?>
                    </div>

                </nav>
            </div>

            <!-- Sidebar Bottom: User Profile & Mode Switcher -->
            <div class="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/80 shrink-0">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center font-bold text-xs font-mono shrink-0 ring-2 ring-slate-200 dark:ring-slate-700">
                            <?= htmlspecialchars(substr($currentUser['name'] ?? 'U', 0, 1)) ?>
                        </div>
                        <div class="min-w-0">
                            <p class="font-extrabold text-xs text-slate-900 dark:text-white truncate"><?= htmlspecialchars($currentUser['name'] ?? 'User') ?></p>
                            <span class="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider"><?= htmlspecialchars($currentUser['role'] ?? 'ADMIN') ?></span>
                        </div>
                    </div>

                    <!-- Dark Mode Switcher -->
                    <button @click="isDarkMode = !isDarkMode" 
                            class="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-amber-400 hover:bg-white dark:hover:bg-slate-800 transition text-xs"
                            :title="isDarkMode ? 'Mode Terang' : 'Mode Gelap'">
                        <template x-if="isDarkMode">
                            <svg class="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/></svg>
                        </template>
                        <template x-if="!isDarkMode">
                            <svg class="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>
                        </template>
                    </button>
                </div>

                <a href="logout.php" 
                   class="w-full flex items-center justify-center gap-2 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition">
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                    <span>Keluar Sistem</span>
                </a>
            </div>

        </aside>

        <!-- ============================================================= -->
        <!-- 2. MAIN APPLICATION CONTENT AREA                               -->
        <!-- ============================================================= -->
        <div class="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen smooth-scroll">
            
            <!-- Top Sticky Navigation Bar (Clean Minimalist SaaS) -->
            <header class="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors shrink-0">
                
                <!-- Left: Hamburger (Mobile) + Unified Search Bar -->
                <div class="flex items-center gap-3 flex-1 max-w-lg">
                    <button @click="sidebarOpen = true" 
                            class="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                    </button>

                    <div class="relative w-full">
                        <input type="text" x-model="searchQuery" id="global-search-input"
                               @input.debounce.300ms="fetchProjects()"
                               placeholder="Cari proyek, klien, kode, atau catatan..." 
                               class="w-full text-xs font-semibold rounded-xl pl-9 pr-12 py-2.5 bg-slate-100/90 dark:bg-slate-800 border-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white placeholder-slate-400 transition">
                        <svg class="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        <span class="absolute right-3 top-2.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-mono font-bold pointer-events-none hidden sm:inline">Ctrl+K</span>
                    </div>
                </div>

                <!-- Right: Header Quick Action Buttons -->
                <div class="flex items-center gap-2 sm:gap-3">
                    
                    <!-- Client Dashboard Switcher Button -->
                    <a href="client.php" target="_blank"
                       class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition shadow-2xs"
                       title="Buka Dashboard Client">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span class="hidden md:inline">Dashboard Client</span>
                    </a>

                    <!-- AI Tracker Quick Launch Button -->
                    <button @click="openAiTrackerModal()"
                            class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm shadow-indigo-500/20 transition active:scale-95"
                            title="Buka AI Tracker & Konsultan Gemini">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        <span class="hidden sm:inline">AI Tracker</span>
                        <template x-if="aiAnalysis && aiAnalysis.counts && aiAnalysis.counts.total_anomalies > 0">
                            <span class="px-1.5 py-0.2 rounded-full text-[9px] bg-white/25 text-white font-mono font-bold" x-text="aiAnalysis.counts.total_anomalies"></span>
                        </template>
                    </button>

                    <!-- New Project Button -->
                    <?php if ($canEdit): ?>
                    <button @click="openCreateModal()" 
                            class="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-blue-600/25 active:scale-95 transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                        <span class="hidden sm:inline">Proyek Baru</span>
                    </button>
                    <?php endif; ?>

                </div>

            </header>

            <!-- Main Scrollable Dashboard Content -->
            <main id="hero-section" class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px]">

                <!-- ============================================================= -->
                <!-- ============================================================= -->
                <!-- 1. UNIFIED HERO CARD (Modern Fintech / Digital Wallet UI)     -->
                <!-- ============================================================= -->
                <section class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-fintech transition-all duration-300 relative overflow-hidden">
                    
                    <!-- Ambient Luxury Glow -->
                    <div class="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
                    <div class="absolute -left-24 -bottom-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

                    <div class="relative z-10 p-6 sm:p-8 lg:p-9">
                        
                        <!-- Top Row: Balance Display & Quick Digital Wallet Actions -->
                        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            
                            <!-- Left: Net Cash Display & Digital Vault Identification -->
                            <div>
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <span>Vault Arus Kas Utama</span>
                                        <span class="text-slate-400 dark:text-slate-500">•</span>
                                        <span class="font-mono text-[10px] text-slate-500 dark:text-slate-400">IDR (Rupiah Riil)</span>
                                    </span>
                                    
                                    <!-- Eye Visibility Toggle Button -->
                                    <button @click="isBalanceHidden = !isBalanceHidden" 
                                            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition"
                                            :title="isBalanceHidden ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'">
                                        <template x-if="!isBalanceHidden">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                        </template>
                                        <template x-if="isBalanceHidden">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                                        </template>
                                    </button>
                                </div>

                                <!-- Big Amount Typography (Stripe & Linear Clean Hero) -->
                                <div class="flex items-baseline gap-3 flex-wrap">
                                    <div class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white font-mono"
                                         x-text="isBalanceHidden ? 'Rp ••••••••' : formatRupiah(summary.total_net_cash)">
                                        Rp 0
                                    </div>
                                    <span class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                                        <svg class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                                        <span>Kas Likuid Aman</span>
                                    </span>
                                </div>

                                <p class="text-xs text-slate-500 dark:text-slate-400 mt-2.5 font-medium flex items-center gap-1.5 flex-wrap">
                                    <span>Kalkulasi Otomatis:</span>
                                    <span>Kas Masuk Klien (<strong class="text-emerald-600 dark:text-emerald-400 font-mono" x-text="isBalanceHidden ? '•••' : formatRupiah(summary.total_paid_clients)"></strong>)</span>
                                    <span class="text-slate-400">−</span>
                                    <span>Honor Tim Terbayar (<strong class="text-amber-600 dark:text-amber-400 font-mono" x-text="isBalanceHidden ? '•••' : formatRupiah(summary.total_paid_team)"></strong>)</span>
                                </p>
                            </div>

                            <!-- Right: Digital Wallet Quick Action Bar -->
                            <div class="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                                <?php if ($canEdit): ?>
                                <!-- Primary Action: Deep Charcoal Proyek Baru -->
                                <button @click="openCreateModal()"
                                        class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-xs px-4 py-3 rounded-2xl transition active:scale-95 shadow-sm">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                                    <span>Proyek Baru</span>
                                </button>

                                <!-- Secondary Action: Emerald Pastel Catat Pemasukan -->
                                <button @click="openQuickPaymentModal()"
                                        class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-950 border border-emerald-200/80 dark:border-emerald-800 font-bold text-xs px-4 py-3 rounded-2xl transition active:scale-95 shadow-2xs">
                                    <svg class="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                                    <span>Catat Kas Masuk</span>
                                </button>

                                <!-- Secondary Action: Amber Pastel Bayar Tim -->
                                <button @click="openQuickTeamModal()"
                                        class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-950 border border-amber-200/80 dark:border-amber-800 font-bold text-xs px-4 py-3 rounded-2xl transition active:scale-95 shadow-2xs">
                                    <svg class="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                                    <span>Bayar Honor Tim</span>
                                </button>
                                <?php endif; ?>

                                <!-- Cyan Pastel Shortcut: Dashboard Client -->
                                <a href="client.php" target="_blank"
                                   class="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-2xl border border-cyan-200/80 dark:border-cyan-800 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 transition text-xs font-bold shadow-2xs"
                                   title="Buka Dashboard Client">
                                    <span class="w-1.5 h-1.5 rounded-full bg-cyan-600"></span>
                                    <span class="hidden xl:inline">Portal Klien</span>
                                </a>

                                <!-- Print Rekap -->
                                <a href="export.php?id=1" target="_blank"
                                   class="inline-flex items-center justify-center w-11 h-11 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-2xs"
                                   title="Cetak Rekap Kas PDF">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                                </a>
                            </div>

                        </div>

                        <!-- Middle: Unified 4-Metric Grid (Clean Minimalist Financial Health with Muted Pastels) -->
                        <div class="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            
                            <!-- 1. Sisa Piutang Klien (Rose Pastel Accent) -->
                            <div class="p-4 sm:p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/90 dark:border-rose-900/40 hover:border-rose-300 transition">
                                <div class="flex items-center justify-between gap-2 mb-2">
                                    <div class="flex items-center gap-2">
                                        <div class="w-7 h-7 rounded-xl bg-rose-100/80 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 flex items-center justify-center text-xs font-bold">
                                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                        </div>
                                        <span class="text-[10px] uppercase font-extrabold tracking-wider text-rose-700 dark:text-rose-400">Piutang di Luar</span>
                                    </div>
                                    <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                </div>
                                <div class="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-rose-600 dark:text-rose-400 tracking-tight"
                                     x-text="isBalanceHidden ? '••••••' : formatRupiah(summary.total_receivables)">Rp 0</div>
                                <span class="text-[11px] font-semibold text-rose-600/90 dark:text-rose-400/90 block mt-1.5" x-text="`${summary.counts.need_billing} klien belum lunas`"></span>
                            </div>

                            <!-- 2. Tanggungan Hak Tim (Amber Pastel Accent) -->
                            <div class="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100/90 dark:border-amber-900/40 hover:border-amber-300 transition">
                                <div class="flex items-center justify-between gap-2 mb-2">
                                    <div class="flex items-center gap-2">
                                        <div class="w-7 h-7 rounded-xl bg-amber-100/80 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 flex items-center justify-center text-xs font-bold">
                                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                        </div>
                                        <span class="text-[10px] uppercase font-extrabold tracking-wider text-amber-800 dark:text-amber-400">Hak Tim Tertunda</span>
                                    </div>
                                    <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                                </div>
                                <div class="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-amber-700 dark:text-amber-400 tracking-tight"
                                     x-text="isBalanceHidden ? '••••••' : formatRupiah(summary.total_payables)">Rp 0</div>
                                <span class="text-[11px] font-semibold text-amber-800/90 dark:text-amber-300/90 block mt-1.5" x-text="`${summary.counts.need_payout} proyek ada sisa honor`"></span>
                            </div>

                            <!-- 3. Total Kas Masuk (Emerald Pastel Accent) -->
                            <div class="p-4 sm:p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/90 dark:border-emerald-900/40 hover:border-emerald-300 transition">
                                <div class="flex items-center justify-between gap-2 mb-2">
                                    <div class="flex items-center gap-2">
                                        <div class="w-7 h-7 rounded-xl bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center justify-center text-xs font-bold">
                                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                        </div>
                                        <span class="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800 dark:text-emerald-400">Total Kas Masuk</span>
                                    </div>
                                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                                </div>
                                <div class="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-emerald-700 dark:text-emerald-400 tracking-tight"
                                     x-text="isBalanceHidden ? '••••••' : formatRupiah(summary.total_paid_clients)">Rp 0</div>
                                <span class="text-[11px] font-medium text-emerald-800/90 dark:text-emerald-400 block mt-1.5" x-text="`${calcPercent(summary.total_paid_clients, summary.total_contract)}% dari total kontrak`"></span>
                            </div>

                            <!-- 4. Nilai Kontrak Portfolio (Blue/Indigo Pastel Accent) -->
                            <div class="p-4 sm:p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/90 dark:border-blue-900/40 hover:border-blue-300 transition">
                                <div class="flex items-center justify-between gap-2 mb-2">
                                    <div class="flex items-center gap-2">
                                        <div class="w-7 h-7 rounded-xl bg-blue-100/80 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                                        </div>
                                        <span class="text-[10px] uppercase font-extrabold tracking-wider text-blue-800 dark:text-blue-400">Nilai Kontrak</span>
                                    </div>
                                    <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                                </div>
                                <div class="text-xl sm:text-2xl lg:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight"
                                     x-text="isBalanceHidden ? '••••••' : formatRupiah(summary.total_contract)">Rp 0</div>
                                <span class="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mt-1.5" x-text="`${summary.counts.total} proyek terdaftar`"></span>
                            </div>

                        </div>

                        <!-- Bottom: Integrated AI Sentinel Cashflow Strip (Linear-Inspired) -->
                        <div class="mt-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-slate-50 to-purple-50/60 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-indigo-500/20 shrink-0">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                </div>
                                <div>
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <span class="text-xs font-black tracking-tight text-slate-900 dark:text-white">AI Cashflow Sentinel</span>
                                        <span class="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800">
                                            Audit Arus Kas Aktif
                                        </span>
                                        <template x-if="aiAnalysis && aiAnalysis.counts">
                                            <span class="px-2 py-0.5 rounded-full text-[9px] font-bold"
                                                  :class="aiAnalysis.counts.critical > 0 ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200'"
                                                  x-text="aiAnalysis.counts.critical > 0 ? `${aiAnalysis.counts.critical} Proyek Perlu Penyesuaian` : 'Portofolio Aman'"></span>
                                        </template>
                                    </div>
                                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1"
                                       x-text="aiAnalysis && aiAnalysis.counts ? `AI mendeteksi ${aiAnalysis.counts.total_anomalies} catatan audit (${aiAnalysis.counts.critical} defisit kas, ${aiAnalysis.counts.warning} potensi duplikasi/tempo). Sistem beroperasi normal.` : 'AI sedang memeriksa integritas arus kas...'"></p>
                                </div>
                            </div>

                            <div class="flex items-center gap-2 w-full sm:w-auto shrink-0">
                                <button @click="openAiTrackerModal()" 
                                        class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-indigo-200/80 dark:border-indigo-800 shadow-2xs transition active:scale-95">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                                    <span>Buka Audit AI</span>
                                </button>
                                <button @click="openAiTrackerModal(); aiTrackerTab = 'simulator';" 
                                        class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition active:scale-95">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/></svg>
                                    <span>Simulator</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </section>

                <!-- ============================================================= -->
                <!-- 2. PILL SEGMENTED TABS & VIEW TOGGLE (Stripe & Linear Style)  -->
                <!-- ============================================================= -->
                <section id="proyek-section" class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    <!-- Segmented Control Bar (Apple / Material 3 Pill Style) -->
                    <div class="inline-flex items-center p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200/80 dark:border-slate-700 text-xs overflow-x-auto smooth-scroll gap-1">
                        
                        <!-- All Projects -->
                        <button @click="setFilter('all')" 
                                :class="currentFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-semibold'"
                                class="px-4 py-2 rounded-full transition flex items-center gap-2 whitespace-nowrap">
                            <span>Semua Proyek</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold" x-text="summary.counts.total"></span>
                        </button>

                        <!-- Perlu Ditagih -->
                        <button @click="setFilter('red')" 
                                :class="currentFilter === 'red' ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-xs font-black' : 'text-slate-600 hover:text-rose-600 dark:text-slate-400 font-semibold'"
                                class="px-4 py-2 rounded-full transition flex items-center gap-2 whitespace-nowrap">
                            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                            <span>Perlu Ditagih</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-mono font-bold" x-text="summary.counts.need_billing"></span>
                        </button>

                        <!-- Hak Tim -->
                        <button @click="setFilter('yellow')" 
                                :class="currentFilter === 'yellow' ? 'bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-400 shadow-xs font-black' : 'text-slate-600 hover:text-amber-600 dark:text-slate-400 font-semibold'"
                                class="px-4 py-2 rounded-full transition flex items-center gap-2 whitespace-nowrap">
                            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span>Hak Tim</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-mono font-bold" x-text="summary.counts.need_payout"></span>
                        </button>

                        <!-- Lunas -->
                        <button @click="setFilter('green')" 
                                :class="currentFilter === 'green' ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-black' : 'text-slate-600 hover:text-emerald-600 dark:text-slate-400 font-semibold'"
                                class="px-4 py-2 rounded-full transition flex items-center gap-2 whitespace-nowrap">
                            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Lunas</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-mono font-bold" x-text="summary.counts.settled"></span>
                        </button>
                    </div>

                    <!-- Right Side: View Mode Switcher (Pill Style: Cards vs List) -->
                    <div class="flex items-center gap-2 self-end sm:self-auto">
                        <div class="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-full border border-slate-200/80 dark:border-slate-700 text-xs gap-1">
                            <button @click="viewMode = 'grid'" 
                                    :class="viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 font-medium'"
                                    class="px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                                <span>Cards</span>
                            </button>
                            <button @click="viewMode = 'list'" 
                                    :class="viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 font-medium'"
                                    class="px-3.5 py-1.5 rounded-full transition flex items-center gap-1.5">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                                <span>List</span>
                            </button>
                        </div>
                    </div>

                </section>

                <!-- ============================================================= -->
                <!-- 3. MOBILE-FIRST RESPONSIVE CARD VIEW (Fintech Digital Cards)  -->
                <!-- ============================================================= -->
                <section x-show="viewMode === 'grid'" class="space-y-4">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                        
                        <template x-for="(p, index) in projects" :key="p.project_id">
                            <div class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-fintech hover:shadow-fintech-hover hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden">
                                
                                <div>
                                    <!-- Card Header: Monogram Avatar + Titles + Status Badge -->
                                    <div class="flex items-start justify-between gap-3 mb-3.5">
                                        
                                        <div class="flex items-center gap-3 min-w-0">
                                            <!-- Monogram Avatar in Clean Pastel -->
                                            <div class="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm font-mono tracking-wider shrink-0 transition-transform group-hover:scale-105"
                                                 :class="getAvatarClass(index)">
                                                <span x-text="getInitials(p.project_name)"></span>
                                            </div>
                                            <div class="min-w-0">
                                                <h3 class="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition truncate cursor-pointer"
                                                    @click="openDetailModal(p)"
                                                    x-text="p.project_name"></h3>
                                                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                                                    <span x-text="p.client_name"></span> • <span class="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400" x-text="p.contract_number || p.project_code"></span>
                                                </p>
                                            </div>
                                        </div>

                                        <!-- Status Badge Pill -->
                                        <div class="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                                            <template x-if="p.flag_has_unpaid_receivable == 1">
                                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60">
                                                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                                    Tagih
                                                </span>
                                            </template>
                                            <template x-if="p.flag_has_unpaid_receivable == 0 && p.flag_has_unpaid_payable == 1">
                                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/60">
                                                    <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                    Hak Tim
                                                </span>
                                            </template>
                                            <template x-if="p.visual_status_badge === 'GREEN_SETTLED'">
                                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60">
                                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    Lunas
                                                </span>
                                            </template>
                                        </div>

                                    </div>

                                    <!-- Flowchart Aligned Milestone Pills: Workflow Step + Quota Revisi + AI -->
                                    <div class="flex items-center gap-2 mb-3 flex-wrap">
                                        <!-- Step Pill -->
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold"
                                              :class="{
                                                  'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300': p.workflow_step === 'DONE',
                                                  'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300': p.workflow_step === 'PELUNASAN',
                                                  'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300': p.workflow_step === 'REVISI',
                                                  'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300': p.workflow_step === 'PENGERJAAN' || !p.workflow_step
                                              }">
                                            <span class="w-1.5 h-1.5 rounded-full" :class="{'bg-emerald-500': p.workflow_step === 'DONE', 'bg-indigo-500': p.workflow_step === 'PELUNASAN', 'bg-amber-500': p.workflow_step === 'REVISI', 'bg-blue-500': p.workflow_step === 'PENGERJAAN' || !p.workflow_step}"></span>
                                            <span x-text="p.workflow_step || 'KONTRAK & DP'"></span>
                                        </span>

                                        <!-- Revisi Quota Pill -->
                                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300">
                                            <span>Rev:</span>
                                            <span x-text="(p.current_revision || 0) + '/' + (p.max_revisions || 3)"></span>
                                            <template x-if="p.revision_deal_status === 'DEAL_APPROVED'">
                                                <span class="text-emerald-600 font-extrabold">(DEAL)</span>
                                            </template>
                                        </span>

                                        <!-- AI Mini Status Pill -->
                                        <button @click="openAiTrackerModal(p.project_id)" 
                                                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border transition shadow-2xs hover:scale-105 active:scale-95"
                                                :class="getProjectAiBadge(p.project_id).badgeClass"
                                                :title="'Lihat analisis AI untuk ' + p.project_name">
                                            <span x-text="getProjectAiBadge(p.project_id).icon"></span>
                                            <span x-text="getProjectAiBadge(p.project_id).label"></span>
                                        </button>
                                    </div>

                                    <!-- Financial 3-Column Micro-Grid (Modern Fintech Cards) -->
                                    <div class="grid grid-cols-3 gap-2 my-3 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 text-left">
                                        <!-- 1. Kontrak -->
                                        <div>
                                            <span class="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Kontrak</span>
                                            <span class="text-xs font-black font-mono text-slate-900 dark:text-white truncate block" x-text="formatRupiah(p.total_contract_value)"></span>
                                        </div>
                                        <!-- 2. DP Awal -->
                                        <div>
                                            <span class="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">DP Terbayar</span>
                                            <span class="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 truncate block" x-text="formatRupiah(p.total_dp_paid || p.total_paid_by_client)"></span>
                                        </div>
                                        <!-- 3. Sisa Piutang -->
                                        <div class="text-right">
                                            <span class="text-[9px] uppercase font-bold block mb-0.5" 
                                                  :class="parseFloat(p.client_receivable_remaining) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'">
                                                <span x-text="parseFloat(p.client_receivable_remaining) > 0 ? 'Sisa Piutang' : 'Status'"></span>
                                            </span>
                                            <span class="text-xs font-black font-mono truncate block" 
                                                  :class="parseFloat(p.client_receivable_remaining) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'"
                                                  x-text="parseFloat(p.client_receivable_remaining) > 0 ? formatRupiah(p.client_receivable_remaining) : 'Lunas'"></span>
                                        </div>
                                    </div>

                                    <!-- Progress Meter 1: Uang Masuk dari Klien -->
                                    <div class="space-y-1.5 my-3">
                                        <div class="flex justify-between items-center text-xs">
                                            <span class="font-bold text-slate-600 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
                                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                Diterima dari Klien
                                            </span>
                                            <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs" x-text="formatRupiah(p.total_paid_by_client)"></span>
                                        </div>
                                        <div class="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                                                 :style="`width: ${calcPercent(p.total_paid_by_client, p.total_contract_value)}%`"></div>
                                        </div>
                                        <div class="flex justify-between text-[10px] text-slate-400 font-medium">
                                            <span x-text="`${calcPercent(p.total_paid_by_client, p.total_contract_value)}% tercairkan`"></span>
                                            <span x-text="p.deadline_date ? `Deadline: ${p.deadline_date}` : 'Aktif'"></span>
                                        </div>
                                    </div>

                                    <!-- Progress Meter 2: Honor Tim (Jika Ada) -->
                                    <div class="space-y-1.5 my-3" x-show="parseFloat(p.total_agreed_team_honor) > 0">
                                        <div class="flex justify-between items-center text-xs">
                                            <span class="font-bold text-slate-600 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
                                                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                Honor Tim Terbayar
                                            </span>
                                            <span class="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs" x-text="formatRupiah(p.total_disbursed_to_team)"></span>
                                        </div>
                                        <div class="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div class="h-full bg-amber-500 rounded-full transition-all duration-500" 
                                                 :style="`width: ${calcPercent(p.total_disbursed_to_team, p.total_agreed_team_honor)}%`"></div>
                                        </div>
                                        <div class="flex justify-between text-[10px] font-medium">
                                            <span class="text-slate-400" x-text="`Plafon: ${formatRupiah(p.total_agreed_team_honor)}`"></span>
                                            <span class="text-amber-700 dark:text-amber-400 font-bold" x-show="parseFloat(p.team_payable_remaining) > 0" x-text="`Sisa: ${formatRupiah(p.team_payable_remaining)}`"></span>
                                            <span class="text-emerald-600 dark:text-emerald-400 font-bold" x-show="parseFloat(p.team_payable_remaining) <= 0">Tim Lunas</span>
                                        </div>
                                    </div>

                                    <!-- Notes / Keterangan Tag (Clickable inline edit) -->
                                    <div class="my-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition group/note"
                                         @click="openEditNotes(p)">
                                        <div class="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase mb-1">
                                            <span>Keterangan Proyek</span>
                                            <span class="text-blue-600 dark:text-blue-400 font-bold opacity-0 group-hover/note:opacity-100 transition">Edit</span>
                                        </div>
                                        <p class="text-xs text-slate-700 dark:text-slate-300 line-clamp-2" x-text="p.notes || p.project_detail || '— Belum ada keterangan. Klik untuk menambah —'"></p>
                                    </div>

                                </div>

                                <!-- Card Action Buttons (Fintech Bottom Action Bar - Mobile Touch Target >= 44px) -->
                                <div class="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                    
                                    <!-- WhatsApp Tagih Button -->
                                    <template x-if="p.flag_has_unpaid_receivable == 1">
                                        <button @click="openWaModal(p)" 
                                                class="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-xs active:scale-95 transition">
                                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                                            <span>Tagih WA</span>
                                        </button>
                                    </template>

                                    <template x-if="p.flag_has_unpaid_receivable == 0">
                                        <span class="min-h-[42px] inline-flex items-center text-[11px] font-bold text-emerald-700 dark:text-emerald-400 px-2">
                                            Piutang Tuntas
                                        </span>
                                    </template>

                                    <!-- Quick Action Pill Buttons with Muted Pastel Colors -->
                                    <div class="flex items-center gap-1.5">
                                        
                                        <!-- Buka Portal Klien (Flowchart: Dashboard Client) -->
                                        <a :href="'client.php?id=' + p.project_id" target="_blank"
                                           class="w-10 h-10 rounded-xl border border-cyan-200/90 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-100 transition flex items-center justify-center text-[10px] font-mono font-bold"
                                           title="Buka Dashboard Client (Tampilan Klien)">
                                            CLI
                                        </a>

                                        <!-- Kelola Revisi & Approval Deal (Flowchart: Revisi s/d deal) -->
                                        <button @click="openRevisionsModal(p)" 
                                                class="w-10 h-10 rounded-xl border border-amber-200/90 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition flex items-center justify-center text-[10px] font-mono font-bold"
                                                title="Kelola Kuota Revisi ($max) & Persetujuan DEAL">
                                            REV
                                        </button>

                                        <!-- Sistem Pembayaran Manual (Flowchart: f. Sistem pembayaran nominal uang) -->
                                        <button @click="openPaymentTermsModal(p)" 
                                                class="w-10 h-10 rounded-xl border border-blue-200/90 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition flex items-center justify-center text-[10px] font-mono font-bold"
                                                title="Sistem Pembayaran Termin (Nominal Uang Riil)">
                                            TRM
                                        </button>

                                        <?php if ($canEdit): ?>
                                        <!-- + Payment -->
                                        <button @click="openAddPaymentModal(p)" 
                                                class="w-10 h-10 rounded-xl border border-emerald-200/90 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition flex items-center justify-center text-xs font-bold"
                                                title="Catat Pemasukan Klien">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
                                        </button>

                                        <!-- Team Manage -->
                                        <button @click="openTeamModal(p)" 
                                                class="w-10 h-10 rounded-xl border border-amber-200/90 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition flex items-center justify-center text-xs font-bold"
                                                title="Alokasi Tim & Bayar Honor">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>
                                        </button>
                                        <?php endif; ?>

                                        <!-- Full Detail -->
                                        <button @click="openDetailModal(p)" 
                                                class="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex items-center justify-center text-xs font-bold"
                                                title="Rincian Transaksi">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                        </button>

                                    </div>

                                </div>

                            </div>
                        </template>

                    </div>

                </section>

                <!-- ============================================================= -->
                <!-- 4. MODERN DATA SPREADSHEET (Clean List View - Default)        -->
                <!-- ============================================================= -->
                <section id="proyek-table" x-show="viewMode === 'list'" class="space-y-4">
                    
                    <div class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-fintech overflow-hidden transition">
                        
                        <div class="overflow-x-auto smooth-scroll">
                            <table class="w-full text-left border-collapse text-xs min-w-[1100px]">
                                <thead>
                                    <tr class="border-b uppercase font-extrabold tracking-wider bg-slate-50/90 text-slate-500 border-slate-200/80 dark:bg-slate-950/90 dark:text-slate-400 dark:border-slate-800 text-[11px] whitespace-nowrap">
                                        <th class="py-3.5 px-4 sticky left-0 z-10 bg-slate-50 dark:bg-slate-950 shadow-sm border-r border-slate-200/60 dark:border-slate-800 w-[240px]">Proyek</th>
                                        <th class="py-3.5 px-4 text-right w-[130px]">Nilai Tagihan</th>
                                        <th class="py-3.5 px-4 text-right w-[130px]">Sudah Diterima</th>
                                        <th class="py-3.5 px-4 text-right w-[130px]">Sisa Piutang</th>
                                        <th class="py-3.5 px-4 text-right w-[110px]">Biaya Tim</th>
                                        <th class="py-3.5 px-4 text-right w-[110px]">Dibayar ke Tim</th>
                                        <th class="py-3.5 px-4 text-right w-[110px]">Sisa Hutang Tim</th>
                                        <th class="py-3.5 px-4 w-[200px]">Keterangan</th>
                                        <th class="py-3.5 px-4 text-center w-[150px]">Aksi Cepat</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                                    
                                    <template x-for="(p, index) in projects" :key="p.project_id">
                                        <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                                            :class="index % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-900/30' : 'bg-white dark:bg-slate-900'">
                                            
                                            <!-- 1. Nama Proyek (Sticky Column) -->
                                            <td class="py-3 px-4 font-bold sticky left-0 z-10 border-r border-slate-200/60 dark:border-slate-800 shadow-xs"
                                                :class="index % 2 === 1 ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-900'">
                                                <div class="flex items-center gap-2.5">
                                                    <div class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-[10px] font-mono shrink-0"
                                                         :class="getAvatarClass(index)" x-text="getInitials(p.project_name)"></div>
                                                    <div class="min-w-0 flex-1">
                                                        <div class="text-xs font-extrabold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate max-w-[170px]"
                                                              @click="openDetailModal(p)"
                                                              x-text="p.project_name"></div>
                                                        <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                            <span class="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[90px]" x-text="p.client_name"></span>
                                                            <span class="font-mono text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-1.5 py-0.2 rounded" x-text="p.contract_number || p.project_code"></span>
                                                        </div>
                                                        <div class="flex items-center gap-1 mt-1">
                                                            <span class="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded"
                                                                  :class="p.workflow_step === 'DONE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
                                                                  x-text="p.workflow_step || 'KONTRAK'"></span>
                                                            <span class="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                                                  x-text="'Rev ' + (p.current_revision || 0) + '/' + (p.max_revisions || 3)"></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <!-- 2. Nilai Tagihan (Kontrak) -->
                                            <td class="py-3 px-4 text-right font-mono font-bold whitespace-nowrap text-slate-900 dark:text-white"
                                                x-text="formatRupiah(p.total_contract_value)"></td>

                                            <!-- 3. Sudah Diterima (Pemasukan) -->
                                            <td class="py-3 px-4 text-right whitespace-nowrap">
                                                <div class="font-mono font-bold text-emerald-600 dark:text-emerald-400" x-text="formatRupiah(p.total_paid_by_client)"></div>
                                                <div class="w-16 ml-auto h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1">
                                                    <div class="h-full bg-emerald-500 rounded-full" 
                                                         :style="`width: ${calcPercent(p.total_paid_by_client, p.total_contract_value)}%`"></div>
                                                </div>
                                            </td>

                                            <!-- 4. Sisa Tagihan (Piutang) -->
                                            <td class="py-3 px-4 text-right whitespace-nowrap">
                                                <template x-if="parseFloat(p.client_receivable_remaining) > 0">
                                                    <span class="inline-block px-2.5 py-1 rounded-lg font-mono font-black text-xs bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50"
                                                          x-text="formatRupiah(p.client_receivable_remaining)"></span>
                                                </template>
                                                <template x-if="parseFloat(p.client_receivable_remaining) <= 0">
                                                    <span class="text-emerald-600 dark:text-emerald-400 font-bold font-mono">Rp 0</span>
                                                </template>
                                            </td>

                                            <!-- 5. Biaya Tim -->
                                            <td class="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap"
                                                x-text="formatRupiah(p.total_agreed_team_honor)"></td>

                                            <!-- 6. Sudah Dibayar Tim -->
                                            <td class="py-3 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap"
                                                x-text="formatRupiah(p.total_disbursed_to_team)"></td>

                                            <!-- 7. Sisa Bayar Tim (Hutang) -->
                                            <td class="py-3 px-4 text-right whitespace-nowrap">
                                                <template x-if="parseFloat(p.team_payable_remaining) > 0">
                                                    <span class="inline-block px-2.5 py-1 rounded-lg font-mono font-black text-xs bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50"
                                                          x-text="formatRupiah(p.team_payable_remaining)"></span>
                                                </template>
                                                <template x-if="parseFloat(p.team_payable_remaining) <= 0">
                                                    <span class="text-slate-400 font-mono">Rp 0</span>
                                                </template>
                                            </td>

                                            <!-- 8. Keterangan -->
                                            <td class="py-3 px-4 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                                <span class="hover:text-blue-600 cursor-pointer text-xs" 
                                                      @click="openEditNotes(p)"
                                                      x-text="p.notes || '— Klik untuk catatan —'"></span>
                                            </td>

                                            <!-- 9. Aksi Cepat -->
                                            <td class="py-3 px-4 text-center whitespace-nowrap">
                                                <div class="flex items-center justify-center gap-1.5">
                                                    
                                                    <!-- Buka Dashboard Client -->
                                                    <a :href="'client.php?id=' + p.project_id" target="_blank"
                                                       class="px-2 py-1 rounded-lg bg-cyan-50 text-cyan-800 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 transition text-[10px] font-mono font-bold"
                                                       title="Buka Dashboard Client">
                                                        CLI
                                                    </a>

                                                    <!-- Kelola Revisi & Deal -->
                                                    <button @click="openRevisionsModal(p)" 
                                                            class="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition text-[10px] font-mono font-bold"
                                                            title="Kelola Kuota Revisi ($max) & Persetujuan DEAL">
                                                        REV
                                                    </button>

                                                    <!-- Termin Pembayaran Manual -->
                                                    <button @click="openPaymentTermsModal(p)" 
                                                            class="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition text-[10px] font-mono font-bold"
                                                            title="Sistem Pembayaran Termin (Nominal Uang)">
                                                        TRM
                                                    </button>

                                                    <!-- WhatsApp Reminder -->
                                                    <template x-if="p.flag_has_unpaid_receivable == 1">
                                                        <button @click="openWaModal(p)" 
                                                                class="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition text-xs font-bold"
                                                                title="Kirim Pengingat Tagihan WhatsApp">
                                                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                                                        </button>
                                                    </template>

                                                    <?php if ($canEdit): ?>
                                                    <!-- + Catat Kas Masuk -->
                                                    <button @click="openAddPaymentModal(p)" 
                                                            class="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition text-xs font-bold"
                                                            title="Catat Pembayaran Masuk">
                                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
                                                    </button>

                                                    <!-- + Bayar Tim -->
                                                    <button @click="openTeamModal(p)" 
                                                            class="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition text-xs font-bold"
                                                            title="Alokasi Honor Tim & Pembayaran">
                                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                                    </button>
                                                    <?php endif; ?>

                                                    <!-- Rincian Proyek -->
                                                    <button @click="openDetailModal(p)" 
                                                            class="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition text-xs font-bold"
                                                            title="Lihat Rincian & Riwayat Lengkap">
                                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                                    </button>

                                                </div>
                                            </td>

                                        </tr>
                                    </template>

                                </tbody>
                            </table>
                        </div>

                    </div>

                </section>

            </main>

        </div>
        <!-- /Main View Wrapper -->

    </div>
    <!-- /App Shell Container -->

    <!-- ============================================================= -->
    <!-- MODAL: AI Payment Tracker & Audit Hub (Minimalkan Kesalahan)   -->
    <!-- ============================================================= -->
    <div x-cloak x-show="modals.aiTracker" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div @click.away="modals.aiTracker = false" class="rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border transition bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white max-h-[92vh] flex flex-col">
            
            <!-- Modal Header -->
            <div class="flex justify-between items-start border-b pb-4 mb-4 border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-3.5">
                    <div class="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-indigo-500/20">
                        AI
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="text-lg sm:text-xl font-black tracking-tight">AI Payment Tracker & Audit</h3>
                            <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                Real-Time Guard
                            </span>
                        </div>
                        <p class="text-xs text-slate-400 font-medium mt-0.5">
                            Deteksi dini overpayment, transaksi duplikat, piutang menunggak, dan risiko defisit kas talangan
                        </p>
                    </div>
                </div>
                <button @click="modals.aiTracker = false" class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white text-base font-bold transition">&times;</button>
            </div>

            <!-- Segmented Navigation Tabs -->
            <div class="flex items-center gap-2 p-1 mb-5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs font-bold">
                <button @click="aiTrackerTab = 'summary'" 
                        :class="aiTrackerTab === 'summary' ? 'bg-white text-indigo-700 shadow-sm dark:bg-indigo-600 dark:text-white font-extrabold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
                        class="flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5">
                    <span>Ringkasan Audit</span>
                    <template x-if="aiAnalysis && aiAnalysis.counts && aiAnalysis.counts.total_anomalies > 0">
                        <span class="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-mono" x-text="aiAnalysis.counts.total_anomalies"></span>
                    </template>
                </button>
                <button @click="aiTrackerTab = 'project'" 
                        :class="aiTrackerTab === 'project' ? 'bg-white text-indigo-700 shadow-sm dark:bg-indigo-600 dark:text-white font-extrabold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
                        class="flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5">
                    <span>Audit per Proyek</span>
                </button>
                <button @click="aiTrackerTab = 'simulator'" 
                        :class="aiTrackerTab === 'simulator' ? 'bg-white text-indigo-700 shadow-sm dark:bg-indigo-600 dark:text-white font-extrabold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
                        class="flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5">
                    <span>Simulator Transaksi</span>
                </button>
                <button @click="aiTrackerTab = 'gemini'" 
                        :class="aiTrackerTab === 'gemini' ? 'bg-white text-indigo-700 shadow-sm dark:bg-indigo-600 dark:text-white font-extrabold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'"
                        class="flex-1 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5">
                    <span>Tanya AI Gemini</span>
                    <span class="w-1.5 h-1.5 rounded-full" :class="geminiHasKey || (geminiApiKey && geminiApiKey.length > 5) ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'"></span>
                </button>
            </div>

            <!-- Modal Body Content -->
            <div class="overflow-y-auto flex-1 pr-1 space-y-6 text-xs smooth-scroll">
                
                <!-- ========================================================= -->
                <!-- TAB 1: EXECUTIVE AUDIT SUMMARY & ANOMALY CARDS            -->
                <!-- ========================================================= -->
                <div x-show="aiTrackerTab === 'summary'" class="space-y-5">
                    
                    <!-- Executive AI Narration Card -->
                    <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-blue-50/90 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/40 border border-indigo-200/80 dark:border-indigo-800/80 shadow-sm relative overflow-hidden">
                        <div class="flex items-center justify-between mb-2">
                            <span class="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                <span class="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                Executive Financial Narration
                            </span>
                            <span class="text-[10px] text-slate-400" x-text="aiAnalysis ? 'Diperbarui: ' + aiAnalysis.analyzed_at : ''"></span>
                        </div>
                        <p class="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium"
                           x-html="aiAnalysis && aiAnalysis.executive_narration ? aiAnalysis.executive_narration.replace(/\*\*(.*?)\*\*/g, '<strong class=\'font-extrabold text-slate-900 dark:text-white\'>$1</strong>') : 'Memuat analisis keuangan AI...'"></p>
                    </div>

                    <!-- 4 KPI Score Cards -->
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <!-- Score -->
                        <div class="p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800">
                            <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">Skor Integritas</span>
                            <div class="text-xl sm:text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400" 
                                 x-text="aiAnalysis ? aiAnalysis.system_health_score + '/100' : '—'">—</div>
                            <span class="text-[10px] font-bold"
                                  :class="{
                                      'text-rose-600 dark:text-rose-400': aiAnalysis && aiAnalysis.risk_tier === 'CRITICAL',
                                      'text-amber-600 dark:text-amber-400': aiAnalysis && aiAnalysis.risk_tier === 'MEDIUM',
                                      'text-emerald-600 dark:text-emerald-400': !aiAnalysis || aiAnalysis.risk_tier === 'LOW'
                                  }"
                                  x-text="aiAnalysis ? aiAnalysis.risk_badge_text : 'Normal'"></span>
                        </div>
                        <!-- Kritis -->
                        <div class="p-3.5 rounded-2xl border bg-rose-50/70 border-rose-200/80 dark:bg-rose-950/30 dark:border-rose-900/40">
                            <span class="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block mb-1">Anomali Kritis</span>
                            <div class="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400" 
                                 x-text="aiAnalysis && aiAnalysis.counts ? aiAnalysis.counts.critical : 0">0</div>
                            <span class="text-[10px] text-rose-500 font-medium">Defisit & overpayment</span>
                        </div>
                        <!-- Peringatan -->
                        <div class="p-3.5 rounded-2xl border bg-amber-50/70 border-amber-200/80 dark:bg-amber-950/30 dark:border-amber-900/40">
                            <span class="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block mb-1">Peringatan</span>
                            <div class="text-xl sm:text-2xl font-black font-mono text-amber-700 dark:text-amber-400" 
                                 x-text="aiAnalysis && aiAnalysis.counts ? aiAnalysis.counts.warning : 0">0</div>
                            <span class="text-[10px] text-amber-600 font-medium">Duplikasi & deadline</span>
                        </div>
                        <!-- Proyek Bersih -->
                        <div class="p-3.5 rounded-2xl border bg-emerald-50/70 border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-900/40">
                            <span class="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block mb-1">Proyek Bersih</span>
                            <div class="text-xl sm:text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400" 
                                 x-text="aiAnalysis && aiAnalysis.counts ? aiAnalysis.counts.clean_projects + '/' + aiAnalysis.counts.total_projects : '—'">—</div>
                            <span class="text-[10px] text-emerald-600 font-medium">100% aman tervalidasi</span>
                        </div>
                    </div>

                    <!-- Issues Header & Filter Pills -->
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <h4 class="font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                            <span>Temuan & Analisis Kesalahan Pembayaran</span>
                            <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-[10px]"
                                  x-text="getFilteredAiAnomalies().length + ' temuan'"></span>
                        </h4>

                        <!-- Filter Buttons -->
                        <div class="flex items-center gap-1 text-[11px]">
                            <button @click="aiIssueFilter = 'all'" 
                                    :class="aiIssueFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-medium'"
                                    class="px-2.5 py-1 rounded-lg transition">Semua</button>
                            <button @click="aiIssueFilter = 'CRITICAL'" 
                                    :class="aiIssueFilter === 'CRITICAL' ? 'bg-rose-600 text-white font-extrabold' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 font-medium'"
                                    class="px-2.5 py-1 rounded-lg transition">Kritis</button>
                            <button @click="aiIssueFilter = 'WARNING'" 
                                    :class="aiIssueFilter === 'WARNING' ? 'bg-amber-600 text-white font-extrabold' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 font-medium'"
                                    class="px-2.5 py-1 rounded-lg transition">Peringatan</button>
                            <button @click="aiIssueFilter = 'INFO'" 
                                    :class="aiIssueFilter === 'INFO' ? 'bg-blue-600 text-white font-extrabold' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-medium'"
                                    class="px-2.5 py-1 rounded-lg transition">Rekomendasi</button>
                        </div>
                    </div>

                    <!-- Anomaly Cards List -->
                    <div class="space-y-3">
                        <template x-for="item in getFilteredAiAnomalies()" :key="item.id">
                            <div class="p-4 sm:p-5 rounded-2xl border transition-all"
                                 :class="{
                                     'bg-rose-50/50 border-rose-200/90 dark:bg-rose-950/20 dark:border-rose-900/50': item.severity === 'CRITICAL',
                                     'bg-amber-50/50 border-amber-200/90 dark:bg-amber-950/20 dark:border-amber-900/50': item.severity === 'WARNING',
                                     'bg-blue-50/50 border-blue-200/90 dark:bg-blue-950/20 dark:border-blue-900/50': item.severity === 'INFO'
                                 }">
                                
                                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-2.5">
                                    <div class="flex items-start gap-2.5">
                                        <div class="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                                             :class="{
                                                 'bg-rose-100 text-rose-700 dark:bg-rose-900/70 dark:text-rose-200': item.severity === 'CRITICAL',
                                                 'bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-200': item.severity === 'WARNING',
                                                 'bg-blue-100 text-blue-700 dark:bg-blue-900/70 dark:text-blue-200': item.severity === 'INFO'
                                             }">
                                            <span class="w-2 h-2 rounded-full" :class="item.severity === 'CRITICAL' ? 'bg-rose-500' : (item.severity === 'WARNING' ? 'bg-amber-500' : 'bg-blue-500')"></span>
                                        </div>
                                        <div>
                                            <h5 class="font-extrabold text-sm text-slate-900 dark:text-white" x-text="item.title"></h5>
                                            <p class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                Proyek: <strong class="text-slate-800 dark:text-slate-200" x-text="item.project_name"></strong> • <span x-text="item.client_name"></span>
                                            </p>
                                        </div>
                                    </div>

                                    <div class="shrink-0 flex items-center gap-2">
                                        <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
                                              :class="{
                                                  'bg-rose-100 text-rose-700 dark:bg-rose-900/80 dark:text-rose-200 border border-rose-300 dark:border-rose-800': item.severity === 'CRITICAL',
                                                  'bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200 border border-amber-300 dark:border-amber-800': item.severity === 'WARNING',
                                                  'bg-blue-100 text-blue-700 dark:bg-blue-900/80 dark:text-blue-200 border border-blue-300 dark:border-blue-800': item.severity === 'INFO'
                                              }"
                                              x-text="item.severity === 'CRITICAL' ? 'KRITIS' : (item.severity === 'WARNING' ? 'PERINGATAN' : 'OPTIMASI')"></span>
                                    </div>
                                </div>

                                <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3" x-text="item.description"></p>

                                <!-- Impact and Solution Strip -->
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 text-[11px] mb-3">
                                    <div>
                                        <span class="font-bold text-slate-400 block text-[10px] uppercase">Dampak Finansial:</span>
                                        <span class="text-slate-700 dark:text-slate-300 font-medium" x-text="item.impact"></span>
                                    </div>
                                    <div>
                                        <span class="font-bold text-slate-400 block text-[10px] uppercase">Rekomendasi Tindakan AI:</span>
                                        <span class="text-slate-700 dark:text-slate-300 font-medium" x-text="item.solution"></span>
                                    </div>
                                </div>

                                <!-- Action Trigger Button -->
                                <div class="flex justify-end pt-1">
                                    <button @click="handleAiAction(item)" 
                                            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
                                            :class="{
                                                'bg-rose-600 hover:bg-rose-700 text-white': item.severity === 'CRITICAL',
                                                'bg-amber-500 hover:bg-amber-600 text-white': item.severity === 'WARNING',
                                                'bg-blue-600 hover:bg-blue-700 text-white': item.severity === 'INFO'
                                            }">
                                        <span x-text="item.action_label"></span>
                                    </button>
                                </div>

                            </div>
                        </template>

                        <!-- Empty State -->
                        <div x-show="getFilteredAiAnomalies().length === 0" 
                             class="text-center py-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                            <span class="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">STATUS BERSIH</span>
                            <h5 class="text-sm font-extrabold text-slate-900 dark:text-white">Tidak ada anomali terdeteksi</h5>
                            <p class="text-slate-400 text-xs mt-1">Seluruh transaksi pada kategori ini memenuhi standar integritas finansial dan pembukuan.</p>
                        </div>
                    </div>

                </div>

                <!-- ========================================================= -->
                <!-- TAB 2: AUDIT PER PROYEK (DEEP DIVE AUDIT)                 -->
                <!-- ========================================================= -->
                <div x-show="aiTrackerTab === 'project'" class="space-y-4">
                    
                    <!-- Project Selector Dropdown -->
                    <div>
                        <label class="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Pilih Proyek untuk Audit Mendalam:</label>
                        <select x-model="aiSelectedProjectId" @change="onSelectAiProject($event.target.value)" 
                                class="w-full text-xs font-bold border rounded-2xl px-4 py-3 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                            <option value="">-- Pilih Proyek yang Ingin Diaudit --</option>
                            <template x-for="p in projects" :key="p.project_id">
                                <option :value="p.project_id" x-text="`${p.project_name} • Klien: ${p.client_name}`"></option>
                            </template>
                        </select>
                    </div>

                    <!-- Project Deep Dive Result -->
                    <template x-if="aiProjectAnalysis && aiProjectAnalysis.project">
                        <div class="space-y-4 pt-2">
                            
                            <!-- Project Scorecard Banner -->
                            <div class="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <h4 class="text-base font-black text-slate-900 dark:text-white" x-text="aiProjectAnalysis.project.project_name"></h4>
                                        <span class="font-mono text-[10px] text-slate-400" x-text="aiProjectAnalysis.project.project_code"></span>
                                    </div>
                                    <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                        Klien: <strong class="text-slate-800 dark:text-slate-200" x-text="aiProjectAnalysis.project.client_name"></strong> • 
                                        Kontak: <span x-text="aiProjectAnalysis.project.client_phone || 'Belum diisi'"></span>
                                    </p>
                                </div>

                                <div class="flex items-center gap-3">
                                    <div class="text-right">
                                        <span class="text-[10px] uppercase font-bold text-slate-400 block">Skor Kesehatan</span>
                                        <span class="text-lg font-black font-mono"
                                              :class="{
                                                  'text-rose-600 dark:text-rose-400': aiProjectAnalysis.audit && aiProjectAnalysis.audit.status === 'CRITICAL',
                                                  'text-amber-600 dark:text-amber-400': aiProjectAnalysis.audit && aiProjectAnalysis.audit.status === 'WARNING',
                                                  'text-emerald-600 dark:text-emerald-400': !aiProjectAnalysis.audit || aiProjectAnalysis.audit.status === 'HEALTHY' || aiProjectAnalysis.audit.status === 'INFO'
                                              }"
                                              x-text="aiProjectAnalysis.audit ? aiProjectAnalysis.audit.score + '/100' : '100/100'"></span>
                                    </div>
                                    <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
                                          :class="{
                                              'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300': aiProjectAnalysis.audit && aiProjectAnalysis.audit.status === 'CRITICAL',
                                              'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300': aiProjectAnalysis.audit && aiProjectAnalysis.audit.status === 'WARNING',
                                              'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300': !aiProjectAnalysis.audit || aiProjectAnalysis.audit.status === 'HEALTHY' || aiProjectAnalysis.audit.status === 'INFO'
                                          }"
                                          x-text="aiProjectAnalysis.audit ? aiProjectAnalysis.audit.status : 'HEALTHY'"></span>
                                </div>
                            </div>

                            <!-- 4 Key Numbers -->
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                                <div class="p-3 rounded-xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
                                    <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Nilai Kontrak</span>
                                    <strong class="font-mono text-xs text-slate-900 dark:text-white" x-text="formatRupiah(aiProjectAnalysis.project.total_contract_value)"></strong>
                                </div>
                                <div class="p-3 rounded-xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
                                    <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Diterima Klien</span>
                                    <strong class="font-mono text-xs text-emerald-600 dark:text-emerald-400" x-text="formatRupiah(aiProjectAnalysis.project.total_paid_by_client)"></strong>
                                </div>
                                <div class="p-3 rounded-xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
                                    <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Sisa Piutang</span>
                                    <strong class="font-mono text-xs text-rose-600 dark:text-rose-400" x-text="formatRupiah(aiProjectAnalysis.project.client_receivable_remaining)"></strong>
                                </div>
                                <div class="p-3 rounded-xl border bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
                                    <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Kas Riil di Tangan</span>
                                    <strong class="font-mono text-xs" 
                                            :class="parseFloat(aiProjectAnalysis.project.net_cash_in_hand) < 0 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-900 dark:text-white'"
                                            x-text="formatRupiah(aiProjectAnalysis.project.net_cash_in_hand)"></strong>
                                </div>
                            </div>

                            <!-- 5-Point Security Audit Checklist -->
                            <div class="p-4 rounded-2xl border bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800 space-y-2">
                                <h5 class="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2">
                                    Checklist 5 Poin Keamanan Pembayaran AI
                                </h5>

                                <!-- Point 1: Overpayment Klien -->
                                <div class="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                                    <span class="text-slate-700 dark:text-slate-300 font-medium">1. Cek Batas Pembayaran Klien (Overbilling Protection)</span>
                                    <span class="font-bold" 
                                          :class="parseFloat(aiProjectAnalysis.project.total_paid_by_client) > parseFloat(aiProjectAnalysis.project.total_contract_value) ? 'text-rose-600' : 'text-emerald-600'"
                                          x-text="parseFloat(aiProjectAnalysis.project.total_paid_by_client) > parseFloat(aiProjectAnalysis.project.total_contract_value) ? 'Melebihi Kontrak' : 'Aman (Sesuai Plafon)'"></span>
                                </div>

                                <!-- Point 2: Defisit Kas Riil -->
                                <div class="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                                    <span class="text-slate-700 dark:text-slate-300 font-medium">2. Cek Saldo Kas Bersih (Anti Dana Talangan Pribadi)</span>
                                    <span class="font-bold" 
                                          :class="parseFloat(aiProjectAnalysis.project.net_cash_in_hand) < 0 ? 'text-rose-600' : 'text-emerald-600'"
                                          x-text="parseFloat(aiProjectAnalysis.project.net_cash_in_hand) < 0 ? 'Kas Defisit (Uang Talangan Aktif)' : 'Kas Positif Aman'"></span>
                                </div>

                                <!-- Point 3: Plafon Honor Tim -->
                                <div class="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                                    <span class="text-slate-700 dark:text-slate-300 font-medium">3. Cek Komitmen Honor Tim vs Nilai Kontrak</span>
                                    <span class="font-bold" 
                                          :class="parseFloat(aiProjectAnalysis.project.total_agreed_team_honor) > parseFloat(aiProjectAnalysis.project.total_contract_value) ? 'text-rose-600' : 'text-emerald-600'"
                                          x-text="parseFloat(aiProjectAnalysis.project.total_agreed_team_honor) > parseFloat(aiProjectAnalysis.project.total_contract_value) ? 'Honor Melebihi Kontrak' : 'Margin Sehat (' + aiProjectAnalysis.project.profit_margin_percentage + '%)'"></span>
                                </div>

                                <!-- Point 4: Duplikasi Transaksi -->
                                <div class="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                                    <span class="text-slate-700 dark:text-slate-300 font-medium">4. Integritas Duplikasi Nominal Transaksi Masuk/Keluar</span>
                                    <span class="font-bold" 
                                          :class="aiProjectAnalysis.anomalies && aiProjectAnalysis.anomalies.some(a => a.type.includes('DUPLICATE')) ? 'text-amber-600' : 'text-emerald-600'"
                                          x-text="aiProjectAnalysis.anomalies && aiProjectAnalysis.anomalies.some(a => a.type.includes('DUPLICATE')) ? 'Potensi Input Ganda' : 'Tidak Ada Duplikasi'"></span>
                                </div>

                                <!-- Point 5: Kesiapan Penagihan WA -->
                                <div class="flex items-center justify-between py-1.5">
                                    <span class="text-slate-700 dark:text-slate-300 font-medium">5. Kelengkapan Saluran Penagihan (No Telepon WhatsApp)</span>
                                    <span class="font-bold" 
                                          :class="!aiProjectAnalysis.project.client_phone ? 'text-amber-600' : 'text-emerald-600'"
                                          x-text="!aiProjectAnalysis.project.client_phone ? 'No WA Belum Terdaftar' : 'Siap Kirim Reminder'"></span>
                                </div>
                            </div>

                            <!-- Anomalies specific to this project -->
                            <div x-show="aiProjectAnalysis.anomalies && aiProjectAnalysis.anomalies.length > 0">
                                <h5 class="font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 text-[11px] mb-2.5">
                                    Daftar Isu Terdeteksi pada Proyek Ini:
                                </h5>
                                <div class="space-y-2.5">
                                    <template x-for="item in aiProjectAnalysis.anomalies" :key="item.id">
                                        <div class="p-3.5 rounded-xl border"
                                             :class="{
                                                 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800': item.severity === 'CRITICAL',
                                                 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800': item.severity === 'WARNING',
                                                 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800': item.severity === 'INFO'
                                             }">
                                            <div class="flex justify-between items-start">
                                                <strong class="text-slate-900 dark:text-white" x-text="item.title"></strong>
                                                <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
                                                      :class="{
                                                          'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200': item.severity === 'CRITICAL',
                                                          'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200': item.severity === 'WARNING',
                                                          'bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200': item.severity === 'INFO'
                                                      }"
                                                      x-text="item.severity"></span>
                                            </div>
                                            <p class="text-[11px] text-slate-600 dark:text-slate-300 mt-1" x-text="item.description"></p>
                                            <div class="mt-2 flex justify-end">
                                                <button @click="handleAiAction(item)" class="px-3 py-1 rounded-lg text-[10px] font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                                                    <span x-text="item.action_label"></span> →
                                                </button>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </div>

                        </div>
                    </template>

                    <!-- Empty state if no project selected -->
                    <div x-show="!aiSelectedProjectId" class="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                        <span class="text-xs font-black uppercase tracking-wider text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 inline-block mb-2">PILIH PROYEK</span>
                        <h5 class="text-sm font-extrabold text-slate-900 dark:text-white">Pilih Proyek dari Menu Dropdown</h5>
                        <p class="text-slate-400 text-xs mt-1">Sistem AI akan menyajikan checklist 5 poin audit, skor risiko keuangan, dan rincian transaksi proyek tersebut.</p>
                    </div>

                </div>

                <!-- ========================================================= -->
                <!-- TAB 3: SIMULATOR TRANSAKSI AI (WHAT-IF ANALYSIS)          -->
                <!-- ========================================================= -->
                <div x-show="aiTrackerTab === 'simulator'" class="space-y-4">
                    
                    <div class="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 dark:bg-indigo-950/30 dark:border-indigo-900/40">
                        <div class="flex items-start gap-2.5">
                            <span class="w-2 h-2 rounded-full bg-indigo-500 mt-1 shrink-0"></span>
                            <div>
                                <h5 class="font-extrabold text-indigo-900 dark:text-indigo-300 text-xs sm:text-sm">Simulator Arus Kas Sebelum Pencatatan Nyata</h5>
                                <p class="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 mt-0.5 leading-relaxed">
                                    Uji coba dampak transaksi terhadap sisa piutang, kas di tangan, dan plafon rekan tim secara virtual untuk memastikan tidak terjadi salah input atau defisit kas.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Simulator Form -->
                    <form @submit.prevent="runAiSimulation()" class="space-y-3 p-4 rounded-2xl border bg-slate-50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800">
                        
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <!-- Project -->
                            <div>
                                <label class="block font-bold text-slate-500 mb-1">Target Proyek *</label>
                                <select x-model="aiSimForm.project_id" required 
                                        @change="aiSimResult = null; if (aiSimForm.project_id) onSelectAiProject(aiSimForm.project_id);"
                                        class="w-full text-xs font-bold rounded-xl px-3 py-2.5 border bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                                    <option value="">-- Pilih Proyek --</option>
                                    <template x-for="p in projects" :key="p.project_id">
                                        <option :value="p.project_id" x-text="p.project_name"></option>
                                    </template>
                                </select>
                            </div>

                            <!-- Type -->
                            <div>
                                <label class="block font-bold text-slate-500 mb-1">Jenis Transaksi *</label>
                                <select x-model="aiSimForm.type" required @change="aiSimResult = null"
                                        class="w-full text-xs font-bold rounded-xl px-3 py-2.5 border bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                                    <option value="CLIENT_PAYMENT">Pemasukan Klien (Cash-In)</option>
                                    <option value="TEAM_PAYMENT">Pencairan Honor Tim (Cash-Out)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Team Member Selector if Team Payment -->
                        <div x-show="aiSimForm.type === 'TEAM_PAYMENT' && aiProjectAnalysis && aiProjectAnalysis.team_members && aiProjectAnalysis.team_members.length > 0">
                            <label class="block font-bold text-slate-500 mb-1">Pilih Anggota Tim Penerima *</label>
                            <select x-model="aiSimForm.member_id" 
                                    class="w-full text-xs font-bold rounded-xl px-3 py-2.5 border bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                                <option value="">-- Pilih Rekan Tim --</option>
                                <template x-for="m in (aiProjectAnalysis ? aiProjectAnalysis.team_members : [])" :key="m.id">
                                    <option :value="m.id" x-text="`${m.member_name} (${m.member_role || 'Tim'}) - Sisa Honor: ${formatRupiah(m.remaining_honor)}`"></option>
                                </template>
                            </select>
                        </div>

                        <!-- Amount -->
                        <div>
                            <label class="block font-bold text-slate-500 mb-1">Nominal Simulasi (Rp) *</label>
                            <input type="number" x-model="aiSimForm.amount" required placeholder="Contoh: 2500000" 
                                   class="w-full text-sm font-black font-mono rounded-xl px-3.5 py-2.5 border bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white focus:outline-none">
                        </div>

                        <div class="flex justify-end pt-1">
                            <button type="submit" 
                                    :disabled="aiSimLoading"
                                    class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2">
                                <span x-show="aiSimLoading" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                <span>Jalankan Simulasi AI</span>
                            </button>
                        </div>
                    </form>

                    <!-- Simulation Result Display -->
                    <template x-if="aiSimResult">
                        <div class="p-4 sm:p-5 rounded-2xl border transition-all space-y-3"
                             :class="aiSimResult.is_safe ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800' : 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800'">
                            
                            <!-- Verdict Header -->
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="w-2.5 h-2.5 rounded-full" :class="aiSimResult.is_safe ? 'bg-emerald-500' : 'bg-rose-500'"></span>
                                    <h5 class="text-sm font-black"
                                        :class="aiSimResult.is_safe ? 'text-emerald-900 dark:text-emerald-300' : 'text-rose-900 dark:text-rose-300'"
                                        x-text="aiSimResult.is_safe ? 'HASIL SIMULASI: TRANSAKSI AMAN UNTUK DIEKSEKUSI' : 'HASIL SIMULASI: TERDETEKSI POTENSI RISIKO!'"></h5>
                                </div>
                                <span class="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                                      :class="aiSimResult.is_safe ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200'"
                                      x-text="aiSimResult.verdict"></span>
                            </div>

                            <!-- Warnings -->
                            <template x-if="aiSimResult.warnings && aiSimResult.warnings.length > 0">
                                <div class="space-y-1">
                                    <template x-for="w in aiSimResult.warnings" :key="w">
                                        <div class="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-200 dark:border-rose-900 flex items-center gap-2" x-text="w"></div>
                                    </template>
                                </div>
                            </template>

                            <!-- Suggestions -->
                            <template x-if="aiSimResult.suggestions && aiSimResult.suggestions.length > 0">
                                <div class="space-y-1">
                                    <template x-for="s in aiSimResult.suggestions" :key="s">
                                        <div class="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200 dark:border-emerald-900 flex items-center gap-2" x-text="s"></div>
                                    </template>
                                </div>
                            </template>

                            <!-- Before vs After Numbers -->
                            <template x-if="aiSimResult.simulated_state">
                                <div class="grid grid-cols-2 gap-2 text-center pt-1">
                                    <template x-if="aiSimForm.type === 'CLIENT_PAYMENT'">
                                        <div class="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                                            <span class="text-[10px] text-slate-400 block font-bold uppercase">Sisa Piutang Setelah Transaksi:</span>
                                            <span class="font-mono font-black text-xs text-rose-600 dark:text-rose-400" x-text="formatRupiah(aiSimResult.simulated_state.new_receivable)"></span>
                                            <span class="text-[9px] text-slate-400 block mt-0.5" x-text="'(Sebelumnya: ' + formatRupiah(aiSimResult.simulated_state.current_receivable) + ')'"></span>
                                        </div>
                                    </template>
                                    <template x-if="aiSimForm.type === 'TEAM_PAYMENT'">
                                        <div class="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                                            <span class="text-[10px] text-slate-400 block font-bold uppercase">Sisa Honor Tim:</span>
                                            <span class="font-mono font-black text-xs text-amber-600 dark:text-amber-400" x-text="formatRupiah(aiSimResult.simulated_state.new_remaining_honor)"></span>
                                            <span class="text-[9px] text-slate-400 block mt-0.5" x-text="'(Sebelumnya: ' + formatRupiah(aiSimResult.simulated_state.remaining_honor) + ')'"></span>
                                        </div>
                                    </template>

                                    <div class="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                                        <span class="text-[10px] text-slate-400 block font-bold uppercase">Kas di Tangan Setelah Transaksi:</span>
                                        <span class="font-mono font-black text-xs" 
                                              :class="aiSimResult.simulated_state.new_net_cash < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'"
                                              x-text="formatRupiah(aiSimResult.simulated_state.new_net_cash)"></span>
                                        <span class="text-[9px] text-slate-400 block mt-0.5" x-text="'(Sebelumnya: ' + formatRupiah(aiSimResult.simulated_state.current_net_cash) + ')'"></span>
                                    </div>
                                </div>
                            </template>

                            <!-- Apply to Live Form Button -->
                            <div class="flex justify-end pt-2">
                                <button type="button" @click="applySimulationToPayment()" 
                                        class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 transition active:scale-95 shadow-sm">
                                    <span>Terapkan ke Form Pencatatan Nyata</span>
                                </button>
                            </div>

                        </div>
                    </template>

                </div>

                <!-- ========================================================= -->
                <!-- TAB 4: TANYA AI GEMINI (PROMPT ASSISTANT & KEY INPUT)     -->
                <!-- ========================================================= -->
                <div x-show="aiTrackerTab === 'gemini'" class="space-y-4">
                    
                    <!-- 1. Gemini API Key Setting Card -->
                    <div class="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border border-indigo-500/30">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div class="flex items-center gap-2.5">
                                <div class="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-xs font-black shadow-inner">
                                    AI
                                </div>
                                <div>
                                    <h4 class="font-extrabold text-sm text-white">Google Gemini API Key</h4>
                                    <p class="text-[11px] text-indigo-200">Kunci API tersimpan di browser & server secara aman</p>
                                </div>
                            </div>

                            <!-- Status Badge -->
                            <div>
                                <template x-if="geminiHasKey || (geminiApiKey && geminiApiKey.length > 5)">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                        API Key Tersedia
                                    </span>
                                </template>
                                <template x-if="!geminiHasKey && (!geminiApiKey || geminiApiKey.length <= 5)">
                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                        <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                        Belum Ada API Key
                                    </span>
                                </template>
                            </div>
                        </div>

                        <!-- Key Input & Action Buttons -->
                        <div class="space-y-2">
                            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <div class="relative flex-1">
                                    <input :type="geminiKeyVisible ? 'text' : 'password'" 
                                           x-model="geminiApiKey" 
                                           placeholder="Tempel Google Gemini API Key di sini (AIzaSy...)"
                                           class="w-full text-xs font-mono font-bold rounded-xl pl-3.5 pr-16 py-2.5 bg-slate-800/90 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <button type="button" @click="geminiKeyVisible = !geminiKeyVisible" 
                                            class="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-[10px] font-bold uppercase transition"
                                            :title="geminiKeyVisible ? 'Sembunyikan' : 'Tampilkan'">
                                        <span x-text="geminiKeyVisible ? 'Sembunyi' : 'Lihat'"></span>
                                    </button>
                                </div>

                                <div class="flex items-center gap-2 shrink-0">
                                    <button type="button" @click="saveGeminiKey()" 
                                            class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition active:scale-95">
                                        Simpan Key
                                    </button>
                                    <button type="button" @click="testGeminiKey()" 
                                            :disabled="geminiTesting"
                                            class="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 font-bold text-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5">
                                        <span x-show="geminiTesting" class="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                                        <span>Tes Koneksi</span>
                                    </button>
                                </div>
                            </div>

                            <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                                <span>
                                    <template x-if="geminiSavedKeyMasked">
                                        <span x-text="'Tersimpan: ' + geminiSavedKeyMasked"></span>
                                    </template>
                                </span>
                                <a href="https://aistudio.google.com/app/apikey" target="_blank" 
                                   class="text-indigo-300 hover:text-white underline inline-flex items-center gap-1 font-semibold">
                                    <span>Dapatkan API Key Gratis di Google AI Studio</span>
                                    <span>↗</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Chat History Area -->
                    <div id="gemini-chat-history" 
                         class="h-80 sm:h-96 overflow-y-auto rounded-2xl border p-4 space-y-3.5 bg-slate-50/70 dark:bg-slate-950/50 border-slate-200/80 dark:border-slate-800 smooth-scroll">
                        
                        <template x-for="(msg, idx) in geminiConversation" :key="idx">
                            <div class="flex gap-2.5" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
                                
                                <!-- Bot Icon -->
                                <template x-if="msg.role === 'model'">
                                    <div class="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-sm">
                                        AI
                                    </div>
                                </template>

                                <!-- Message Bubble -->
                                <div class="max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 shadow-2xs leading-relaxed"
                                     :class="msg.role === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : (msg.isError 
                                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900 rounded-tl-none' 
                                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-tl-none')">
                                    
                                    <div class="flex items-center justify-between gap-2 mb-1 pb-1 border-b"
                                         :class="msg.role === 'user' ? 'border-blue-500/40' : 'border-slate-100 dark:border-slate-800'">
                                        <span class="text-[10px] font-black uppercase tracking-wider"
                                              :class="msg.role === 'user' ? 'text-blue-200' : 'text-indigo-600 dark:text-indigo-400'"
                                              x-text="msg.role === 'user' ? 'Anda' : 'Gemini AI Consultant'"></span>
                                        <div class="flex items-center gap-1.5 text-[9px] opacity-75">
                                            <span x-text="msg.time"></span>
                                            <template x-if="msg.role === 'model' && !msg.isError">
                                                <button type="button" @click="copyToClipboard(msg.text)" 
                                                        class="hover:text-blue-500 ml-1 transition text-[10px] font-bold" title="Salin Jawaban">
                                                    Salin
                                                </button>
                                            </template>
                                        </div>
                                    </div>

                                    <div class="text-xs space-y-1.5 break-words" x-html="renderMarkdown(msg.text)"></div>
                                </div>

                                <!-- User Avatar -->
                                <template x-if="msg.role === 'user'">
                                    <div class="w-7 h-7 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                        U
                                    </div>
                                </template>

                            </div>
                        </template>

                        <!-- Thinking Indicator -->
                        <div x-show="geminiLoading" class="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold p-2">
                            <div class="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Gemini sedang berpikir & menganalisis data kas Anda...</span>
                        </div>
                    </div>

                    <!-- 3. Quick Prompt Chips -->
                    <div>
                        <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Pertanyaan Cepat (1-Klik):</span>
                        <div class="flex flex-wrap gap-1.5">
                            <template x-for="chip in geminiQuickPrompts" :key="chip">
                                <button type="button" @click="sendGeminiPrompt(chip)" 
                                        :disabled="geminiLoading"
                                        class="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-white border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-medium transition active:scale-95 disabled:opacity-50 text-left">
                                    <span x-text="chip"></span>
                                </button>
                            </template>
                        </div>
                    </div>

                    <!-- 4. Prompt Input Bar -->
                    <form @submit.prevent="sendGeminiPrompt()" class="space-y-2">
                        <div class="relative flex items-center">
                            <textarea x-model="geminiPromptInput" 
                                      @keydown.enter.prevent="if (!$event.shiftKey) sendGeminiPrompt()"
                                      rows="2" 
                                      placeholder="Tanyakan analisis kas, draf penagihan WA, atau risiko proyek ke Gemini AI (Enter untuk kirim)..."
                                      class="w-full text-xs font-medium rounded-2xl p-3 pr-24 border bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"></textarea>
                            
                            <button type="submit" 
                                    :disabled="geminiLoading || !geminiPromptInput.trim()"
                                    class="absolute right-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-xs shadow-sm transition active:scale-95 disabled:opacity-40 flex items-center gap-1.5">
                                <span>Kirim</span>
                                <span>↗</span>
                            </button>
                        </div>

                        <div class="flex items-center justify-between text-[11px] text-slate-400">
                            <label class="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" x-model="geminiIncludeContext" class="rounded text-indigo-600 focus:ring-0">
                                <span>Sertakan Data Arus Kas & Proyek Terkini dalam Prompt</span>
                            </label>
                            <span>Model: Google Gemini 1.5/2.0 Flash</span>
                        </div>
                    </form>

                </div>

            </div>

        </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL: Ubah Keterangan / Catatan Cepat                        -->
    <!-- ============================================================= -->
    <div x-cloak x-show="modals.editNotes" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div @click.away="modals.editNotes = false" class="rounded-3xl max-w-md w-full p-6 shadow-2xl border transition bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white">
            
            <div class="flex justify-between items-center border-b pb-3 mb-4 border-slate-100 dark:border-slate-800">
                <div>
                    <h3 class="text-base font-extrabold">Ubah Keterangan Proyek</h3>
                    <p class="text-xs text-slate-400 font-medium" x-text="activeProject ? activeProject.project_name : ''"></p>
                </div>
                <button @click="modals.editNotes = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <form @submit.prevent="submitUpdateNotes()" class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Teks Keterangan:</label>
                    <textarea x-model="formNotesText" rows="4" required class="w-full text-xs rounded-2xl p-3.5 border focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white font-medium"></textarea>
                </div>

                <div class="flex justify-end gap-2.5 pt-2">
                    <button type="button" @click="modals.editNotes = false" class="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl">Batal</button>
                    <button type="submit" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/25 active:scale-95 transition">
                        Simpan Keterangan
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL: Tambah Proyek Baru (Aligned with Flowchart 1. Admin)   -->
    <!-- No Kontrak, Tgl Kontrak, Detail, Client, Tagihan, DP, Durasi, Termin Manual, Revisi $max -->
    <!-- ============================================================= -->
    <div x-cloak x-show="modals.create" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div @click.away="modals.create = false" class="rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border transition bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white max-h-[90vh] overflow-y-auto smooth-scroll">
            
            <div class="flex justify-between items-center border-b pb-4 mb-4 border-slate-100 dark:border-slate-800">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">1. DASHBOARD ADMIN</span>
                        <h3 class="text-lg font-black tracking-tight">Input Kontrak & Proyek Baru</h3>
                    </div>
                    <p class="text-xs text-slate-400 font-medium mt-0.5">Sesuai alur bagan: No. Kontrak, DP, Sistem Pembayaran Manual, & Kuota Revisi</p>
                </div>
                <button @click="modals.create = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <form @submit.prevent="submitCreateProject()" class="space-y-4 text-xs">
                
                <!-- Section: No. Kontrak & Tgl Kontrak -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                    <div>
                        <label class="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">No. Kontrak / SPK</label>
                        <input type="text" x-model="formCreate.contract_number" placeholder="Contoh: SPK/2026/011-JGL (Otomatis jika kosong)" 
                               class="w-full text-xs font-mono font-semibold border rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tgl Kontrak *</label>
                        <input type="date" x-model="formCreate.contract_date" required 
                               class="w-full text-xs font-semibold border rounded-xl px-3.5 py-2.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
                    </div>
                </div>

                <!-- Section: a. Nama Project & Detail Project -->
                <div>
                    <label class="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">a. Nama Project *</label>
                    <input type="text" x-model="formCreate.project_name" required placeholder="Contoh: Proyek Jonggol" 
                           class="w-full text-sm font-bold border rounded-2xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                </div>

                <div>
                    <label class="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Detail Project (Lingkup & Spesifikasi Pekerjaan)</label>
                    <textarea x-model="formCreate.project_detail" rows="2" placeholder="Contoh: Pembuatan arsitektur sistem informasi, dashboard analitik, dan branding kawasan Jonggol Terpadu..." 
                              class="w-full text-xs border rounded-2xl px-3.5 py-2.5 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white font-medium"></textarea>
                </div>

                <!-- Section: b. Nama Client & Kontak -->
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label class="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">b. Nama Client *</label>
                        <input type="text" x-model="formCreate.client_name" required placeholder="PT Mitra Perkasa Jonggol" 
                               class="w-full text-xs font-semibold border rounded-xl px-3.5 py-2.5 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">WhatsApp Klien</label>
                        <input type="text" x-model="formCreate.client_phone" placeholder="081234567890" 
                               class="w-full text-xs font-mono font-semibold border rounded-xl px-3.5 py-2.5 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Email Klien (Auto Invoice)</label>
                        <input type="email" x-model="formCreate.client_email" placeholder="klien@jonggol.co.id" 
                               class="w-full text-xs font-mono font-semibold border rounded-xl px-3.5 py-2.5 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                    </div>
                </div>

                <!-- Section: c. Total Tagihan & d. DP Awal -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">c. Total Tagihan Proyek (Rp) *</label>
                        <input type="number" x-model="formCreate.total_contract_value" required placeholder="11000000" @input="autoFillCreateTerms()" 
                               class="w-full text-sm font-black font-mono border rounded-xl px-4 py-2.5 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">d. DP Awal (Rp - Uang Riil)</label>
                        <input type="number" x-model="formCreate.initial_dp" placeholder="2750000 (Case Jonggol 25%)" 
                               class="w-full text-sm font-mono border rounded-xl px-4 py-2.5 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                    </div>
                </div>

                <!-- Section: e. Durasi Pekerjaan Awal - Akhir (Deadline) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">e. Tgl Mulai Pekerjaan</label>
                        <input type="date" x-model="formCreate.start_date" 
                               class="w-full text-xs font-semibold border rounded-xl px-3.5 py-2.5 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">e. Tgl Selesai / Deadline</label>
                        <input type="date" x-model="formCreate.deadline_date" 
                               class="w-full text-xs font-semibold border rounded-xl px-3.5 py-2.5 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                    </div>
                </div>

                <!-- Section: g. Revisi ($max: Revisi Mayor = 3-5x) -->
                <div class="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60">
                    <div class="flex items-center justify-between mb-2">
                        <label class="block font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider text-[11px]">
                            g. Batas Maksimal Kuota Revisi ($max)
                        </label>
                        <span class="text-[10px] text-amber-700 dark:text-amber-400 font-bold">Rekomendasi Mayor = 3 - 5x</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <input type="number" min="1" max="10" x-model="formCreate.max_revisions" required
                               class="w-24 text-center font-bold font-mono text-sm border rounded-xl px-3 py-2 bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white">
                        <span class="text-xs text-slate-500">kali kesempatan revisi mayor dari klien sampai deal.</span>
                    </div>
                </div>

                <!-- Section: f. Sistem Pembayaran Input Manual (Dalam Uang Bukan Persentase) -->
                <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                                f. Sistem Pembayaran Input Manual (Nominal Uang)
                            </span>
                            <span class="text-[10px] text-slate-400">Case Jonggol: DP 25%, Termin 50%, Pelunasan 25% dibuat jadi Uang Riil (Rp)</span>
                        </div>
                        <button type="button" @click="autoFillCreateTerms()" class="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">
                            Hitung Uang Otomatis
                        </button>
                    </div>

                    <!-- Term Rows -->
                    <div class="space-y-2">
                        <template x-for="(term, idx) in formCreate.payment_terms" :key="idx">
                            <div class="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                <div class="col-span-5">
                                    <input type="text" x-model="term.term_name" placeholder="Nama Termin" required
                                           class="w-full text-xs font-bold border-none bg-transparent text-slate-900 dark:text-white p-1 focus:ring-0">
                                </div>
                                <div class="col-span-4">
                                    <input type="number" x-model="term.amount" placeholder="Nominal Rp" required
                                           class="w-full text-xs font-mono font-bold border-none bg-transparent text-right text-emerald-600 dark:text-emerald-400 p-1 focus:ring-0">
                                </div>
                                <div class="col-span-2">
                                    <input type="date" x-model="term.due_date"
                                           class="w-full text-[10px] border-none bg-transparent text-slate-500 p-1 focus:ring-0">
                                </div>
                                <div class="col-span-1 text-center">
                                    <button type="button" @click="removeFormCreateTermRow(idx)" class="text-rose-500 hover:text-rose-700 font-bold text-sm">&times;</button>
                                </div>
                            </div>
                        </template>
                    </div>

                    <div class="flex items-center justify-between pt-1">
                        <button type="button" @click="addFormCreateTermRow()" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                            + Tambah Baris Termin
                        </button>
                        <div class="text-xs font-mono font-bold" :class="totalFormCreateTerms() == formCreate.total_contract_value ? 'text-emerald-600' : 'text-amber-600'">
                            Total Termin: <span x-text="formatRupiah(totalFormCreateTerms())"></span>
                        </div>
                    </div>
                </div>

                <div class="pt-3 flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" @click="modals.create = false" class="text-xs font-bold text-slate-400 hover:text-slate-700 px-4 py-2.5">Batal</button>
                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl shadow-md shadow-blue-600/25 active:scale-95 transition">
                        Simpan Kontrak & Proyek
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL: KELOLA REVISI ($max & APPROVAL DEAL)                   -->
    <!-- Flowchart: Revisi sampai dengan deal / maximal revisi         -->
    <!-- ============================================================= -->
    <div x-cloak x-show="modals.revisions" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div @click.away="modals.revisions = false" class="rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border transition bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white max-h-[90vh] overflow-y-auto smooth-scroll">
            
            <div class="flex justify-between items-center border-b pb-4 mb-4 border-slate-100 dark:border-slate-800">
                <div>
                    <h3 class="text-base font-black tracking-tight">
                        Kelola Kuota & Persetujuan Revisi
                    </h3>
                    <p class="text-xs text-slate-400 font-medium" x-text="activeProject ? activeProject.project_name : ''"></p>
                </div>
                <button @click="modals.revisions = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <template x-if="activeRevisionsData">
                <div class="space-y-4 text-xs">
                    
                    <!-- Quota Summary Cards -->
                    <div class="grid grid-cols-3 gap-2 text-center">
                        <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                            <span class="text-[10px] uppercase font-bold text-slate-400 block">Maksimal ($max)</span>
                            <span class="text-lg font-black font-mono" x-text="activeRevisionsData.max_revisions + 'x'"></span>
                        </div>
                        <div class="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
                            <span class="text-[10px] uppercase font-bold block">Terpakai</span>
                            <span class="text-lg font-black font-mono" x-text="activeRevisionsData.current_revision + 'x'"></span>
                        </div>
                        <div class="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300">
                            <span class="text-[10px] uppercase font-bold block">Sisa Kuota</span>
                            <span class="text-lg font-black font-mono" x-text="activeRevisionsData.remaining_revisions + 'x'"></span>
                        </div>
                    </div>

                    <!-- Flowchart Action: DEAL REVISI (Menuju Pembayaran Akhir) -->
                    <div class="p-4 rounded-2xl border"
                         :class="activeRevisionsData.revision_deal_status === 'DEAL_APPROVED' ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-800 dark:text-emerald-300' : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-300 dark:border-emerald-800'">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-extrabold text-xs">Persetujuan Deal Revisi:</span>
                            <span class="px-2 py-0.5 rounded font-mono text-[10px] font-bold"
                                  :class="activeRevisionsData.revision_deal_status === 'DEAL_APPROVED' ? 'bg-emerald-600 text-white' : 'bg-amber-200 text-amber-900'"
                                  x-text="activeRevisionsData.revision_deal_status === 'DEAL_APPROVED' ? 'DEAL APPROVED' : 'BELUM DEAL'"></span>
                        </div>
                        <template x-if="activeRevisionsData.revision_deal_status !== 'DEAL_APPROVED'">
                            <div>
                                <button type="button" @click="approveRevisionDeal(activeProject)"
                                        class="w-full py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-1.5 transition">
                                    <span>Tandai DEAL & Lanjut ke Pembayaran Akhir</span>
                                </button>
                                <p class="text-[10px] text-slate-500 text-center mt-1">Mengikuti bagan alur: Revisi deal → Pembayaran Akhir</p>
                            </div>
                        </template>
                        <template x-if="activeRevisionsData.revision_deal_status === 'DEAL_APPROVED'">
                            <p class="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Hasil revisi telah disetujui. Tahapan proyek saat ini: <strong>PEMBAYARAN AKHIR</strong>.</p>
                        </template>
                    </div>

                    <!-- Form Tambah Catatan Revisi Baru -->
                    <div x-show="activeRevisionsData.remaining_revisions > 0 && activeRevisionsData.revision_deal_status !== 'DEAL_APPROVED'" 
                         class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <span class="font-bold uppercase tracking-wider text-[10px] text-slate-500 block">+ Catat Pengajuan Revisi Baru</span>
                        <div>
                            <input type="text" x-model="formNewRev.title" placeholder="Judul revisi (contoh: Perbaikan skema warna)" 
                                   class="w-full text-xs font-semibold rounded-xl px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        </div>
                        <div>
                            <textarea x-model="formNewRev.description" rows="2" placeholder="Detail catatan revisi..." 
                                      class="w-full text-xs rounded-xl px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"></textarea>
                        </div>
                        <button type="button" @click="submitAdminRevision()" 
                                class="w-full py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs transition">
                            Simpan Revisi
                        </button>
                    </div>

                    <!-- Riwayat Revisi List -->
                    <div class="space-y-2">
                        <span class="font-bold uppercase tracking-wider text-[10px] text-slate-400 block">Daftar Riwayat Revisi:</span>
                        <template x-if="activeRevisionsData.revisions.length === 0">
                            <p class="text-slate-400 italic text-center py-4">Belum ada pengajuan revisi.</p>
                        </template>
                        <template x-for="r in activeRevisionsData.revisions" :key="r.id">
                            <div class="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
                                <div class="flex justify-between items-center font-bold">
                                    <span x-text="'#' + r.revision_number + ' ' + r.title"></span>
                                    <span class="font-mono text-[10px] px-1.5 py-0.5 rounded"
                                          :class="r.status === 'DEAL_APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                                          x-text="r.status"></span>
                                </div>
                                <p class="text-slate-600 dark:text-slate-300 text-xs" x-text="r.description"></p>
                                <span class="text-[10px] text-slate-400 block font-mono" x-text="'Tgl: ' + r.requested_date + ' | Oleh: ' + r.requested_by"></span>
                            </div>
                        </template>
                    </div>

                </div>
            </template>

        </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL: KELOLA SISTEM PEMBAYARAN MANUAL (NOMINAL UANG)         -->
    <!-- Flowchart: Sistem pembayaran input manual & Pembayaran Akhir  -->
    <!-- ============================================================= -->
    <div x-cloak x-show="modals.paymentTerms" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div @click.away="modals.paymentTerms = false" class="rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border transition bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white max-h-[90vh] overflow-y-auto smooth-scroll">
            
            <div class="flex justify-between items-center border-b pb-4 mb-4 border-slate-100 dark:border-slate-800">
                <div>
                    <h3 class="text-base font-black tracking-tight flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">TRM</span> Sistem Pembayaran Termin (Uang Riil)
                    </h3>
                    <p class="text-xs text-slate-400 font-medium" x-text="activeProject ? activeProject.project_name : ''"></p>
                </div>
                <button @click="modals.paymentTerms = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <div class="space-y-4 text-xs">
                
                <!-- Terms List Table -->
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="border-b border-slate-200 dark:border-slate-800 uppercase font-extrabold text-[10px] text-slate-400">
                                <th class="py-2">Termin</th>
                                <th class="py-2 text-right">Nominal (Rp)</th>
                                <th class="py-2 text-center">Status</th>
                                <th class="py-2 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                            <template x-for="t in activeTermsData" :key="t.id">
                                <tr>
                                    <td class="py-2.5">
                                        <div class="font-bold" x-text="t.term_name"></div>
                                        <div class="text-[10px] text-slate-400 font-mono" x-text="t.due_date ? 'Jatuh tempo: ' + t.due_date : ''"></div>
                                    </td>
                                    <td class="py-2.5 text-right font-mono font-bold" x-text="formatRupiah(t.amount)"></td>
                                    <td class="py-2.5 text-center">
                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                                              :class="t.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'"
                                              x-text="t.status === 'PAID' ? 'LUNAS' : 'MENUNGGU'"></span>
                                    </td>
                                    <td class="py-2.5 text-right">
                                        <template x-if="t.status !== 'PAID'">
                                            <button type="button" @click="markPaymentTermPaid(t.id)"
                                                    class="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs transition">
                                                Bayar Lunas
                                            </button>
                                        </template>
                                        <template x-if="t.status === 'PAID'">
                                            <span class="text-emerald-600 text-[10px] font-bold">Terbayar</span>
                                        </template>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>

                <!-- Finalize to DONE Button (Flowchart: Pembayaran Akhir -> Done) -->
                <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <span class="text-[10px] text-slate-400 uppercase font-bold block">Status Workflow:</span>
                        <span class="font-bold font-mono text-blue-600" x-text="activeProject ? activeProject.workflow_step : ''"></span>
                    </div>
                    <button type="button" @click="finalizeProjectDone(activeProject)"
                            class="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5">
                        <span>Finalisasi: Tandai DONE</span>
                    </button>
                </div>

            </div>

        </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL: Catat Pemasukan Klien                                  -->
    <!-- ============================================================= -->
    <div x-cloak x-show="modals.payment" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div @click.away="modals.payment = false" class="rounded-3xl max-w-md w-full p-6 shadow-2xl border transition bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white">
            
            <div class="flex justify-between items-center border-b pb-3 mb-4 border-slate-100 dark:border-slate-800">
                <div>
                    <h3 class="text-base font-black">Catat Pemasukan Klien</h3>
                    <p class="text-xs text-slate-400 font-medium" x-text="activeProject ? activeProject.project_name : ''"></p>
                </div>
                <button @click="modals.payment = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <!-- Sisa Piutang Info Banner -->
            <div class="rounded-2xl p-3.5 mb-4 flex justify-between items-center border bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
                <span class="text-xs font-bold">Sisa Piutang:</span>
                <span class="text-sm font-extrabold font-mono" x-text="activeProject ? formatRupiah(activeProject.client_receivable_remaining) : ''"></span>
            </div>

            <form @submit.prevent="submitClientPayment()" class="space-y-4 text-xs">
                
                <!-- Project Selector if opened from Quick Pill -->
                <div x-show="!activeProject || isQuickPaymentMode">
                    <label class="block font-bold text-slate-500 uppercase tracking-wider mb-1">Pilih Proyek *</label>
                    <select x-model="formPayment.project_id" @change="onSelectProjectInPayment($event.target.value)" 
                            class="w-full text-xs font-bold border rounded-2xl px-3.5 py-3 focus:outline-none bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                        <option value="">-- Pilih Proyek --</option>
                        <template x-for="p in projects" :key="p.project_id">
                            <option :value="p.project_id" x-text="`${p.project_name} (Sisa Piutang: ${formatRupiah(p.client_receivable_remaining)})`"></option>
                        </template>
                    </select>
                </div>

                <div>
                    <label class="block font-bold text-slate-500 uppercase tracking-wider mb-1">Jenis Pembayaran *</label>
                    <select x-model="formPayment.payment_type" class="w-full text-xs font-semibold border rounded-2xl px-3.5 py-3 focus:outline-none bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                        <option value="TERMIN">Termin Progres</option>
                        <option value="DOWN_PAYMENT">Uang Muka (DP)</option>
                        <option value="FULL_PAYMENT">Pelunasan</option>
                    </select>
                </div>

                <div>
                    <label class="block font-bold text-slate-500 uppercase tracking-wider mb-1">Jumlah Uang Masuk (Rp) *</label>
                    <input type="number" x-model="formPayment.amount_paid" required placeholder="Contoh: 2500000" 
                           class="w-full text-base font-black font-mono border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                    
                    <!-- AI Real-time Error Prevention Alert -->
                    <template x-if="getClientPaymentAiWarning()">
                        <div class="mt-2.5 p-3 rounded-2xl border text-xs transition-all duration-200"
                             :class="getClientPaymentAiWarning().boxClass">
                            <div class="flex items-start gap-2">
                                <span class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-black/10 dark:bg-white/10 shrink-0">AI</span>
                                <div class="space-y-0.5">
                                    <p class="font-extrabold" x-text="getClientPaymentAiWarning().title"></p>
                                    <p class="text-[11px] opacity-90 leading-relaxed" x-text="getClientPaymentAiWarning().desc"></p>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-bold text-slate-500 uppercase tracking-wider mb-1">Tanggal Terima *</label>
                        <input type="date" x-model="formPayment.payment_date" required class="w-full text-xs font-semibold border rounded-2xl px-3 py-2.5 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                    </div>
                    <div>
                        <label class="block font-bold text-slate-500 uppercase tracking-wider mb-1">Metode</label>
                        <input type="text" x-model="formPayment.payment_method" placeholder="BCA / Mandiri" class="w-full text-xs font-semibold border rounded-2xl px-3 py-2.5 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                    </div>
                </div>

                <div>
                    <label class="block font-bold text-slate-500 uppercase tracking-wider mb-1">Catatan</label>
                    <input type="text" x-model="formPayment.notes" placeholder="Contoh: Termin 1 cair" class="w-full text-xs font-medium border rounded-2xl px-3.5 py-2.5 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                </div>

                <div class="pt-2 flex justify-end gap-2.5">
                    <button type="button" @click="modals.payment = false" class="text-xs font-bold text-slate-400">Batal</button>
                    <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl shadow-md shadow-emerald-600/25 active:scale-95 transition">
                        Simpan Pemasukan
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL: Kelola Tim & Pencairan Honor                           -->
    <!-- ============================================================= -->
    <div x-cloak x-show="modals.team" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div @click.away="modals.team = false" class="rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border transition max-h-[90vh] flex flex-col bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white">
            
            <div class="flex justify-between items-center border-b pb-3 mb-4 border-slate-100 dark:border-slate-800">
                <div>
                    <h3 class="text-base font-black">Kelola Tim & Honor</h3>
                    <p class="text-xs text-slate-400 font-medium" x-text="activeProject ? activeProject.project_name : ''"></p>
                </div>
                <button @click="modals.team = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <!-- Project Selector if opened from Quick Pill -->
            <div x-show="!activeProject || isQuickTeamMode" class="mb-4">
                <label class="block font-bold text-slate-500 text-xs uppercase tracking-wider mb-1">Pilih Proyek *</label>
                <select @change="onSelectProjectInTeam($event.target.value)" 
                        class="w-full text-xs font-bold border rounded-2xl px-3.5 py-3 focus:outline-none bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                    <option value="">-- Pilih Proyek --</option>
                    <template x-for="p in projects" :key="p.project_id">
                        <option :value="p.project_id" x-text="`${p.project_name} (Hutang Tim: ${formatRupiah(p.team_payable_remaining)})`"></option>
                    </template>
                </select>
            </div>

            <div class="overflow-y-auto space-y-6 flex-1 pr-1 text-xs smooth-scroll">
                
                <!-- Existing Team List -->
                <div>
                    <h4 class="font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">Daftar Rekan Kerja & Hak Honor</h4>
                    
                    <div x-show="activeDetail && activeDetail.team_members.length === 0" class="text-center py-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 font-medium italic">
                        Belum ada anggota tim terdaftar untuk proyek ini.
                    </div>

                    <div class="space-y-2.5">
                        <template x-for="m in (activeDetail ? activeDetail.team_members : [])" :key="m.id">
                            <div class="p-4 rounded-2xl border transition bg-slate-50/70 border-slate-200/80 dark:bg-slate-950/70 dark:border-slate-800">
                                <div class="flex justify-between items-start mb-2">
                                    <div>
                                        <h5 class="text-sm font-extrabold text-slate-900 dark:text-white" x-text="m.member_name"></h5>
                                        <p class="text-slate-400 text-[11px] font-medium" x-text="m.member_role"></p>
                                    </div>
                                    <div class="text-right">
                                        <span class="text-slate-400 block text-[10px]">Plafon: <strong class="text-slate-900 dark:text-white font-mono" x-text="formatRupiah(m.agreed_honor)"></strong></span>
                                        <span class="font-mono font-bold" :class="m.remaining_honor > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'"
                                              x-text="m.remaining_honor > 0 ? `Sisa: ${formatRupiah(m.remaining_honor)}` : 'Lunas'"></span>
                                    </div>
                                </div>

                                <!-- Bayar cicilan honor -->
                                <div class="pt-2.5 border-t border-slate-200/60 dark:border-slate-800" x-show="m.remaining_honor > 0">
                                    <div class="flex items-center gap-2">
                                        <input type="number" x-model="memberPayAmounts[m.id]" placeholder="Nominal bayar..." 
                                               class="text-xs font-mono font-bold rounded-xl px-3 py-2 w-40 border focus:outline-none bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                                        <button @click="submitTeamPayment(m.id)" class="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3.5 py-2 rounded-xl shadow-sm transition active:scale-95">
                                            Bayar Honor
                                        </button>
                                    </div>
                                    <!-- AI Team Payout Live Alert -->
                                    <template x-if="getTeamPaymentAiWarning(m)">
                                        <div class="mt-2 p-2 rounded-xl border text-[11px] font-bold transition flex items-center gap-2"
                                             :class="getTeamPaymentAiWarning(m).boxClass">
                                            <span class="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                                            <span x-text="getTeamPaymentAiWarning(m).text"></span>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>

                <!-- Add New Member Form -->
                <div class="border-t pt-4 border-slate-200/80 dark:border-slate-800" x-show="activeProject">
                    <h4 class="font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">+ Tambah Rekan Kerja / Vendor</h4>
                    <form @submit.prevent="submitAddTeamMember()" class="space-y-3 p-4 rounded-2xl border bg-slate-50 border-slate-200/80 dark:bg-slate-950/40 dark:border-slate-800">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block font-bold text-slate-500 mb-1">Nama Rekan *</label>
                                <input type="text" x-model="formMember.member_name" required placeholder="Contoh: Tim A / Laras" 
                                       class="w-full text-xs font-semibold rounded-xl px-3 py-2 border bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-500 mb-1">Peran / Tugas *</label>
                                <input type="text" x-model="formMember.member_role" required placeholder="Analisa Struktur" 
                                       class="w-full text-xs font-semibold rounded-xl px-3 py-2 border bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                            </div>
                        </div>

                        <div>
                            <label class="block font-bold text-slate-500 mb-1">Plafon Honor Disepakati (Rp) *</label>
                            <input type="number" x-model="formMember.agreed_honor" required placeholder="4500000" 
                                   class="w-full text-xs font-mono font-bold rounded-xl px-3 py-2 border bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                        </div>

                        <div class="flex justify-end pt-1">
                            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl transition active:scale-95">
                                Tambahkan ke Tim
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL: Generator WhatsApp Reminder (Fintech Style 1-Klik)     -->
    <!-- ============================================================= -->
    <div x-cloak x-show="modals.wa" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div @click.away="modals.wa = false" class="rounded-3xl max-w-md w-full p-6 shadow-2xl border transition bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white">
            
            <div class="flex justify-between items-center border-b pb-3 mb-4 border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">WA</span>
                    <h3 class="text-base font-black">Kirim Pengingat WhatsApp</h3>
                </div>
                <button @click="modals.wa = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <div class="space-y-4 text-xs">
                <div>
                    <label class="block font-bold text-slate-500 mb-1">WhatsApp Klien:</label>
                    <input type="text" x-model="waTargetPhone" class="w-full font-mono text-sm font-bold border rounded-2xl px-3.5 py-2.5 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                </div>

                <div>
                    <label class="block font-bold text-slate-500 mb-1">Draf Pesan Penagihan Sopan:</label>
                    <textarea x-model="waMessageText" rows="6" class="w-full text-xs font-medium border rounded-2xl p-3.5 focus:outline-none bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white leading-relaxed"></textarea>
                </div>

                <div class="pt-2 flex justify-end gap-2.5">
                    <button type="button" @click="modals.wa = false" class="text-slate-400 font-bold px-3 py-2">Batal</button>
                    <button type="button" @click="sendWhatsAppDirect()" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-2xl shadow-md shadow-emerald-600/30 flex items-center gap-2 active:scale-95 transition">
                        <span>Buka WhatsApp Sekarang</span> ↗
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL: Full Project Detail Drawer                             -->
    <!-- ============================================================= -->
    <div x-cloak x-show="modals.detail" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div @click.away="modals.detail = false" class="rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border transition bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white max-h-[90vh] flex flex-col">
            
            <div class="flex justify-between items-center border-b pb-3 mb-4 border-slate-100 dark:border-slate-800">
                <div>
                    <h3 class="text-lg font-black" x-text="activeDetail ? activeDetail.project.project_name : ''"></h3>
                    <p class="text-xs text-slate-400 font-medium">
                        Klien: <span class="font-bold text-slate-700 dark:text-slate-200" x-text="activeDetail ? activeDetail.project.client_name : ''"></span> • 
                        <span class="font-mono" x-text="activeDetail ? activeDetail.project.project_code : ''"></span>
                    </p>
                </div>
                <button @click="modals.detail = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <div class="overflow-y-auto space-y-6 flex-1 pr-1 text-xs smooth-scroll">
                
                <!-- Financial Strip -->
                <div class="grid grid-cols-3 gap-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 text-center">
                    <div>
                        <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Nilai Kontrak</span>
                        <strong class="font-mono text-sm text-slate-900 dark:text-white" x-text="activeDetail ? formatRupiah(activeDetail.project.total_contract_value) : ''"></strong>
                    </div>
                    <div>
                        <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Sudah Diterima</span>
                        <strong class="font-mono text-sm text-emerald-600 dark:text-emerald-400" x-text="activeDetail ? formatRupiah(activeDetail.project.total_paid_by_client) : ''"></strong>
                    </div>
                    <div>
                        <span class="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Sisa Piutang</span>
                        <strong class="font-mono text-sm text-rose-600 dark:text-rose-400" x-text="activeDetail ? formatRupiah(activeDetail.project.client_receivable_remaining) : ''"></strong>
                    </div>
                </div>

                <!-- AI Tracker Project Health Status -->
                <div class="p-3.5 rounded-2xl border flex items-center justify-between gap-3 bg-indigo-50/70 border-indigo-200/80 dark:bg-indigo-950/30 dark:border-indigo-900/40">
                    <div class="flex items-center gap-2.5">
                        <span class="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-black text-[10px]">AI</span>
                        <div>
                            <span class="font-extrabold text-slate-900 dark:text-white text-xs block">AI Tracker Audit Status</span>
                            <span class="text-[11px] text-slate-600 dark:text-slate-300 font-medium"
                                  x-text="activeDetail ? getProjectAiBadge(activeDetail.project.project_id).label : ''"></span>
                        </div>
                    </div>
                    <button @click="openAiTrackerModal(activeDetail.project.project_id)" 
                            class="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition active:scale-95">
                        Buka Audit AI Lengkap →
                    </button>
                </div>

                <!-- Client Payment Timeline -->
                <div>
                    <h4 class="font-extrabold uppercase tracking-wider text-slate-400 mb-2">Riwayat Pemasukan Klien</h4>
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                                <th class="py-2">Termin</th>
                                <th class="py-2">Tanggal</th>
                                <th class="py-2">Metode</th>
                                <th class="py-2 text-right">Nominal</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                            <template x-for="cp in (activeDetail ? activeDetail.client_payments : [])" :key="cp.id">
                                <tr>
                                    <td class="py-2.5 font-bold text-slate-800 dark:text-slate-200" x-text="cp.payment_type"></td>
                                    <td class="py-2.5 text-slate-400" x-text="cp.payment_date"></td>
                                    <td class="py-2.5 text-slate-400" x-text="cp.payment_method"></td>
                                    <td class="py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400" x-text="formatRupiah(cp.amount_paid)"></td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>

                <!-- Action Footnote -->
                <div class="border-t pt-4 flex justify-between items-center border-slate-100 dark:border-slate-800">
                    <button @click="deleteProject(activeDetail.project.project_id)" class="text-xs font-bold text-rose-600 hover:text-rose-800">
                        Hapus Proyek Ini
                    </button>
                    <a :href="`export.php?id=${activeDetail ? activeDetail.project.project_id : 1}`" target="_blank"
                       class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition">
                        Cetak Rekap PDF
                    </a>
                </div>

            </div>
        </div>
    </div>

    <!-- Application Script (Fintech Reactive Logic) -->
    <script>
        function procashApp() {
            return {
                canEdit: <?= $canEdit ? 'true' : 'false' ?>,
                isDarkMode: false, // DEFAULT TO CLEAN WHITE MODE!
                isBalanceHidden: false, // Eye visibility toggle
                viewMode: 'list', // DEFAULT TO LIST VIEW!
                loading: false,
                sidebarOpen: false,
                currentFilter: 'all',
                searchQuery: '',

                isQuickPaymentMode: false,
                isQuickTeamMode: false,

                summary: {
                    total_contract: 0,
                    total_paid_clients: 0,
                    total_receivables: 0,
                    total_team_honor: 0,
                    total_paid_team: 0,
                    total_payables: 0,
                    total_net_cash: 0,
                    total_projected_profit: 0,
                    counts: { total: 0, active: 0, need_billing: 0, need_payout: 0, settled: 0 }
                },
                projects: [],
                activeProject: null,
                activeDetail: null,

                modals: {
                    create: false,
                    payment: false,
                    team: false,
                    wa: false,
                    editNotes: false,
                    detail: false,
                    aiTracker: false,
                    revisions: false,
                    paymentTerms: false
                },

                // State for Flowchart Revisions & Payment Terms
                activeRevisionsData: null,
                activeTermsData: [],
                formNewRev: {
                    title: '',
                    description: '',
                    requested_by: 'Client'
                },
                formNewTerm: {
                    term_name: '',
                    amount: '',
                    due_date: '',
                    notes: ''
                },

                // =====================================================
                // AI Tracker State (Smart Audit & Error Guard)
                // =====================================================
                aiAnalysis: null,
                aiLoading: false,
                aiTrackerTab: 'summary', // 'summary' | 'project' | 'simulator'
                aiIssueFilter: 'all',    // 'all' | 'CRITICAL' | 'WARNING' | 'INFO'
                aiSelectedProjectId: '',
                aiProjectAnalysis: null,
                aiSimForm: {
                    project_id: '',
                    type: 'CLIENT_PAYMENT',
                    amount: '',
                    member_id: ''
                },
                aiSimResult: null,
                aiSimLoading: false,

                // =====================================================
                // Gemini AI Prompt & API Key State
                // =====================================================
                geminiApiKey: '',
                geminiSavedKeyMasked: '',
                geminiHasKey: false,
                geminiKeyVisible: false,
                geminiTesting: false,
                geminiPromptInput: '',
                geminiLoading: false,
                geminiIncludeContext: true,
                geminiConversation: [
                    {
                        role: 'model',
                        text: 'Halo! Saya asisten finansial cerdas Google Gemini yang terhubung langsung dengan portofolio proyek dan arus kas ProCash Anda.\n\nAnda dapat menanyakan hal seperti:\n- "Analisis risiko pembayaran pada proyek aktif saat ini"\n- "Buatkan draf pesan WhatsApp sopan untuk menagih termin klien yang belum bayar"\n- "Apakah kas kita cukup aman untuk membayar honor tim bulan ini?"\n\nSilakan masukkan Google Gemini API Key Anda di atas untuk mulai bertanya!',
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                ],
                geminiQuickPrompts: [
                    "Analisis risiko keuangan & piutang saat ini",
                    "Draf WA sopan untuk penagihan klien yang tertunda",
                    "Apakah kas cukup aman untuk bayar honor tim?",
                    "Rekomendasi prioritas penagihan & pembayaran minggu ini"
                ],

                toast: {
                    show: false,
                    message: '',
                    isError: false,
                    timeout: null
                },

                formCreate: {
                    project_name: '',
                    client_name: '',
                    client_phone: '',
                    total_contract_value: '',
                    initial_dp: '',
                    notes: ''
                },

                formPayment: {
                    project_id: '',
                    amount_paid: '',
                    payment_type: 'TERMIN',
                    payment_date: new Date().toISOString().split('T')[0],
                    payment_method: 'TRANSFER BCA',
                    notes: ''
                },

                formMember: {
                    project_id: null,
                    member_name: '',
                    member_role: '',
                    agreed_honor: ''
                },

                formNotesText: '',
                memberPayAmounts: {},
                waTargetPhone: '',
                waMessageText: '',

                avatarPalettes: [
                    'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
                    'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
                    'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
                    'bg-cyan-100 text-cyan-700 border border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
                    'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
                    'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                ],

                initApp() {
                    const savedMode = localStorage.getItem('procash_dark');
                    if (savedMode !== null) {
                        this.isDarkMode = (savedMode === 'true');
                    } else {
                        this.isDarkMode = false; // Default white!
                    }

                    this.$watch('isDarkMode', val => {
                        localStorage.setItem('procash_dark', val);
                    });

                    const savedView = localStorage.getItem('procash_view');
                    if (savedView) {
                        this.viewMode = savedView;
                    } else {
                        this.viewMode = 'list'; // Default to List view!
                    }

                    this.$watch('viewMode', val => {
                        localStorage.setItem('procash_view', val);
                    });

                    // Keyboard shortcuts: Ctrl+K / Cmd+K for search
                    window.addEventListener('keydown', (e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                            e.preventDefault();
                            const input = document.getElementById('global-search-input');
                            if (input) {
                                input.focus();
                                input.select();
                            }
                        }
                    });

                    this.fetchSummary();
                    this.fetchProjects();
                    this.fetchAiAnalysis();
                    this.fetchGeminiKeyStatus();
                },

                getAvatarClass(index) {
                    return this.avatarPalettes[index % this.avatarPalettes.length];
                },

                getInitials(name) {
                    if (!name) return 'PR';
                    const parts = name.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        return (parts[0][0] + parts[1][0]).toUpperCase();
                    }
                    return name.substring(0, 2).toUpperCase();
                },

                showToast(msg, isErr = false) {
                    this.toast.message = msg;
                    this.toast.isError = isErr;
                    this.toast.show = true;
                    if (this.toast.timeout) clearTimeout(this.toast.timeout);
                    this.toast.timeout = setTimeout(() => {
                        this.toast.show = false;
                    }, 4000);
                },

                async fetchSummary() {
                    try {
                        const res = await fetch('api.php?action=summary');
                        const json = await res.json();
                        if (json.success) {
                            this.summary = json.data;
                        }
                    } catch (e) {
                        console.error('Summary error', e);
                    }
                },

                async fetchProjects() {
                    this.loading = true;
                    try {
                        const url = `api.php?action=projects&filter=${this.currentFilter}&search=${encodeURIComponent(this.searchQuery)}`;
                        const res = await fetch(url);
                        const json = await res.json();
                        if (json.success) {
                            this.projects = json.data;
                        }
                    } catch (e) {
                        this.showToast('Gagal memuat proyek.', true);
                    } finally {
                        this.loading = false;
                    }
                },

                setFilter(f) {
                    this.currentFilter = f;
                    this.fetchProjects();
                },

                formatRupiah(num) {
                    return 'Rp ' + (parseFloat(num) || 0).toLocaleString('id-ID');
                },

                calcPercent(part, total) {
                    const p = parseFloat(part) || 0;
                    const t = parseFloat(total) || 0;
                    if (t <= 0) return 0;
                    return Math.min(100, Math.round((p / t) * 100));
                },

                openCreateModal() {
                    const today = new Date().toISOString().split('T')[0];
                    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
                    this.formCreate = {
                        contract_number: '',
                        contract_date: today,
                        project_name: '',
                        project_detail: '',
                        client_name: '',
                        client_phone: '',
                        client_email: '',
                        total_contract_value: '',
                        initial_dp: '',
                        start_date: today,
                        deadline_date: nextMonth,
                        max_revisions: 3,
                        notes: '',
                        payment_terms: [
                            { term_name: 'DP Awal (25%)', amount: '', due_date: today, notes: 'DP Awal Kontrak' },
                            { term_name: 'Termin Pengerjaan (50%)', amount: '', due_date: '', notes: 'Termin Pengerjaan Inti' },
                            { term_name: 'Pelunasan Akhir (25%)', amount: '', due_date: nextMonth, notes: 'Pelunasan setelah Deal' }
                        ]
                    };
                    this.modals.create = true;
                },

                autoFillCreateTerms() {
                    const val = parseFloat(this.formCreate.total_contract_value) || 0;
                    if (val <= 0) return;
                    const dp = this.formCreate.initial_dp ? parseFloat(this.formCreate.initial_dp) : Math.round(val * 0.25);
                    const termin2 = Math.round(val * 0.50);
                    const pelunasan = Math.max(0, val - (dp + termin2));

                    this.formCreate.payment_terms = [
                        { term_name: 'DP Awal (25%)', amount: dp, due_date: this.formCreate.start_date, notes: 'DP Awal Kontrak' },
                        { term_name: 'Termin Pengerjaan (50%)', amount: termin2, due_date: '', notes: 'Termin Pengerjaan Inti' },
                        { term_name: 'Pelunasan Akhir (25%)', amount: pelunasan, due_date: this.formCreate.deadline_date, notes: 'Pelunasan setelah Deal' }
                    ];
                    if (!this.formCreate.initial_dp) {
                        this.formCreate.initial_dp = dp;
                    }
                },

                addFormCreateTermRow() {
                    this.formCreate.payment_terms.push({
                        term_name: `Termin ${this.formCreate.payment_terms.length + 1}`,
                        amount: '',
                        due_date: '',
                        notes: ''
                    });
                },

                removeFormCreateTermRow(idx) {
                    this.formCreate.payment_terms.splice(idx, 1);
                },

                totalFormCreateTerms() {
                    return (this.formCreate.payment_terms || []).reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
                },

                // Revisions Modal & Actions
                async openRevisionsModal(p) {
                    this.activeProject = p;
                    this.activeRevisionsData = null;
                    this.formNewRev = {
                        title: '',
                        description: '',
                        requested_by: p.client_name || 'Client'
                    };
                    this.modals.revisions = true;
                    try {
                        const res = await fetch(`api.php?action=get_revisions&project_id=${p.project_id}`);
                        const json = await res.json();
                        if (json.success) {
                            this.activeRevisionsData = json.data;
                        }
                    } catch (e) {
                        this.showToast('Gagal memuat data revisi.', true);
                    }
                },

                async submitAdminRevision() {
                    if (!this.activeProject || !this.formNewRev.title || !this.formNewRev.description) {
                        this.showToast('Judul dan catatan revisi wajib diisi.', true);
                        return;
                    }
                    try {
                        const res = await fetch('api.php?action=add_revision', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                project_id: this.activeProject.project_id,
                                title: this.formNewRev.title,
                                description: this.formNewRev.description,
                                requested_by: this.formNewRev.requested_by
                            })
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.showToast('Revisi berhasil dicatat!');
                            this.formNewRev.title = '';
                            this.formNewRev.description = '';
                            this.openRevisionsModal(this.activeProject);
                            this.fetchProjects();
                        } else {
                            this.showToast(json.message, true);
                        }
                    } catch (e) {
                        this.showToast('Gagal mencatat revisi.', true);
                    }
                },

                async approveRevisionDeal(p) {
                    const proj = p || this.activeProject;
                    if (!proj) return;
                    if (!confirm('Setujui seluruh hasil revisi (DEAL FINAL)? Status alur proyek akan otomatis beralih ke Pembayaran Akhir.')) {
                        return;
                    }
                    try {
                        const res = await fetch('api.php?action=approve_revision_deal', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ project_id: proj.project_id })
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.showToast('Revisi DEAL! Melangkah ke Pembayaran Akhir.');
                            if (this.modals.revisions) {
                                this.openRevisionsModal(proj);
                            }
                            this.fetchProjects();
                        } else {
                            this.showToast(json.message, true);
                        }
                    } catch (e) {
                        this.showToast('Gagal menyetujui revisi.', true);
                    }
                },

                // Payment Terms Modal & Actions
                async openPaymentTermsModal(p) {
                    this.activeProject = p;
                    this.activeTermsData = [];
                    this.formNewTerm = {
                        term_name: '',
                        amount: '',
                        due_date: '',
                        notes: ''
                    };
                    this.modals.paymentTerms = true;
                    try {
                        const res = await fetch(`api.php?action=get_payment_terms&project_id=${p.project_id}`);
                        const json = await res.json();
                        if (json.success) {
                            this.activeTermsData = json.data || [];
                        }
                    } catch (e) {
                        this.showToast('Gagal memuat jadwal termin.', true);
                    }
                },

                async markPaymentTermPaid(termId) {
                    if (!this.activeProject) return;
                    try {
                        const res = await fetch('api.php?action=mark_payment_term_paid', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                term_id: termId,
                                paid_date: new Date().toISOString().split('T')[0]
                            })
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.showToast(json.message || 'Pembayaran termin berhasil dicatat!');
                            this.openPaymentTermsModal(this.activeProject);
                            this.fetchProjects();
                            this.fetchSummary();
                        } else {
                            this.showToast(json.message, true);
                        }
                    } catch (e) {
                        this.showToast('Gagal mencatat pembayaran termin.', true);
                    }
                },

                async finalizeProjectDone(p) {
                    const proj = p || this.activeProject;
                    if (!proj) return;
                    if (!confirm('Tandai proyek ini sebagai SELESAI TUNTAS (DONE 100%)?')) return;
                    try {
                        const res = await fetch('api.php?action=finalize_project_done', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ project_id: proj.project_id })
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.showToast('Proyek dinyatakan SELESAI (DONE)!');
                            this.fetchProjects();
                            this.fetchSummary();
                            if (this.modals.paymentTerms) this.modals.paymentTerms = false;
                        } else {
                            this.showToast(json.message, true);
                        }
                    } catch (e) {
                        this.showToast('Gagal menyelesaikan proyek.', true);
                    }
                },

                async submitCreateProject() {
                    try {
                        const res = await fetch('api.php?action=create_project', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(this.formCreate)
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.modals.create = false;
                            this.showToast('Proyek baru berhasil ditambahkan!');
                            this.fetchSummary();
                            this.fetchProjects();
                            this.fetchAiAnalysis();
                        } else {
                            this.showToast(json.message, true);
                        }
                    } catch (e) {
                        this.showToast('Gagal menyimpan proyek.', true);
                    }
                },

                // Quick Inflow Modal (From Hero)
                openQuickPaymentModal() {
                    this.isQuickPaymentMode = true;
                    this.activeProject = null;
                    this.formPayment = {
                        project_id: '',
                        amount_paid: '',
                        payment_type: 'TERMIN',
                        payment_date: new Date().toISOString().split('T')[0],
                        payment_method: 'TRANSFER BCA',
                        notes: ''
                    };
                    this.modals.payment = true;
                },

                onSelectProjectInPayment(projId) {
                    if (!projId) return;
                    const p = this.projects.find(item => item.project_id == projId);
                    if (p) {
                        this.activeProject = p;
                        this.formPayment.amount_paid = p.client_receivable_remaining > 0 ? p.client_receivable_remaining : '';
                    }
                },

                // Inflow Modal from Card
                openAddPaymentModal(p) {
                    this.isQuickPaymentMode = false;
                    this.activeProject = p;
                    this.formPayment = {
                        project_id: p.project_id,
                        amount_paid: p.client_receivable_remaining > 0 ? p.client_receivable_remaining : '',
                        payment_type: 'TERMIN',
                        payment_date: new Date().toISOString().split('T')[0],
                        payment_method: 'TRANSFER BCA',
                        notes: ''
                    };
                    this.modals.payment = true;
                },

                async submitClientPayment() {
                    if (!this.formPayment.project_id) {
                        this.showToast('Pilih proyek terlebih dahulu.', true);
                        return;
                    }
                    try {
                        const res = await fetch('api.php?action=add_client_payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(this.formPayment)
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.modals.payment = false;
                            this.showToast('Pemasukan berhasil dicatat!');
                            this.fetchSummary();
                            this.fetchProjects();
                            this.fetchAiAnalysis();
                        } else {
                            this.showToast(json.message, true);
                        }
                    } catch (e) {
                        this.showToast('Gagal mencatat pembayaran.', true);
                    }
                },

                // Quick Team Payout Modal (From Hero)
                openQuickTeamModal() {
                    this.isQuickTeamMode = true;
                    this.activeProject = null;
                    this.activeDetail = null;
                    this.modals.team = true;
                },

                async onSelectProjectInTeam(projId) {
                    if (!projId) return;
                    const p = this.projects.find(item => item.project_id == projId);
                    if (p) {
                        this.activeProject = p;
                        this.formMember.project_id = p.project_id;
                        this.memberPayAmounts = {};
                        await this.loadProjectDetail(p.project_id);
                    }
                },

                // Team Modal from Card
                async openTeamModal(p) {
                    this.isQuickTeamMode = false;
                    this.activeProject = p;
                    this.formMember.project_id = p.project_id;
                    this.memberPayAmounts = {};
                    await this.loadProjectDetail(p.project_id);
                    this.modals.team = true;
                },

                async loadProjectDetail(id) {
                    try {
                        const res = await fetch(`api.php?action=project_detail&id=${id}`);
                        const json = await res.json();
                        if (json.success) {
                            this.activeDetail = json.data;
                        }
                    } catch (e) {
                        console.error('Detail error', e);
                    }
                },

                async submitAddTeamMember() {
                    try {
                        const res = await fetch('api.php?action=add_team_member', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(this.formMember)
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.showToast('Anggota tim ditambahkan!');
                            this.formMember.member_name = '';
                            this.formMember.member_role = '';
                            this.formMember.agreed_honor = '';
                            await this.loadProjectDetail(this.activeProject.project_id);
                            this.fetchSummary();
                            this.fetchProjects();
                            this.fetchAiAnalysis();
                        } else {
                            this.showToast(json.message, true);
                        }
                    } catch (e) {
                        this.showToast('Gagal menambah tim.', true);
                    }
                },

                async submitTeamPayment(memberId) {
                    const amount = this.memberPayAmounts[memberId];
                    if (!amount || amount <= 0) {
                        this.showToast('Masukkan nominal bayar yang valid.', true);
                        return;
                    }
                    try {
                        const res = await fetch('api.php?action=add_team_payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                project_team_member_id: memberId,
                                amount_paid: amount,
                                payment_date: new Date().toISOString().split('T')[0],
                                payment_method: 'TRANSFER BCA'
                            })
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.showToast('Honor tim berhasil dibayarkan!');
                            this.memberPayAmounts[memberId] = '';
                            await this.loadProjectDetail(this.activeProject.project_id);
                            this.fetchSummary();
                            this.fetchProjects();
                            this.fetchAiAnalysis();
                        } else {
                            this.showToast(json.message, true);
                        }
                    } catch (e) {
                        this.showToast('Gagal memproses pembayaran tim.', true);
                    }
                },

                openEditNotes(p) {
                    this.activeProject = p;
                    this.formNotesText = p.notes || '';
                    this.modals.editNotes = true;
                },

                async submitUpdateNotes() {
                    try {
                        const res = await fetch('api.php?action=update_notes', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: this.activeProject.project_id, notes: this.formNotesText })
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.modals.editNotes = false;
                            this.showToast('Keterangan berhasil diperbarui!');
                            this.fetchProjects();
                        } else {
                            this.showToast(json.message, true);
                        }
                    } catch (e) {
                        this.showToast('Gagal memperbarui keterangan.', true);
                    }
                },

                openDetailModal(p) {
                    this.loadProjectDetail(p.project_id);
                    this.modals.detail = true;
                },

                async deleteProject(id) {
                    if (!confirm('Apakah Anda yakin ingin menghapus proyek ini?')) return;
                    try {
                        const res = await fetch('api.php?action=delete_project', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id })
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.modals.detail = false;
                            this.showToast('Proyek berhasil dihapus.');
                            this.fetchSummary();
                            this.fetchProjects();
                            this.fetchAiAnalysis();
                        }
                    } catch (e) {
                        this.showToast('Gagal menghapus proyek.', true);
                    }
                },

                openWaModal(p) {
                    this.activeProject = p;
                    let phone = p.client_phone || '';
                    if (phone.startsWith('0')) {
                        phone = '62' + phone.substring(1);
                    }
                    this.waTargetPhone = phone;
                    const sisaStr = this.formatRupiah(p.client_receivable_remaining);
                    this.waMessageText = `Halo Mas/Mbak ${p.client_name}\n\nIzin konfirmasi dan mengingatkan mengenai kelanjutan tagihan untuk *${p.project_name}*.\n\nSaat ini sisa tagihan (piutang) yang belum tercatat adalah sebesar *${sisaStr}*.\n\nRekap riwayat pembayaran dapat kami kirimkan kapan saja. Terima kasih banyak atas kerjasamanya.\n\n- Salam hormat, Tim Manajemen Keuangan`;
                    this.modals.wa = true;
                },

                sendWhatsAppDirect() {
                    if (!this.waTargetPhone) {
                        alert('Nomor telepon tidak valid.');
                        return;
                    }
                    const url = `https://wa.me/${this.waTargetPhone}?text=${encodeURIComponent(this.waMessageText)}`;
                    window.open(url, '_blank');
                    this.modals.wa = false;
                },

                // =====================================================
                // AI Tracker Methods & Reactive Validators
                // =====================================================
                async fetchAiAnalysis() {
                    try {
                        const res = await fetch('api.php?action=ai_analysis');
                        const json = await res.json();
                        if (json.success) {
                            this.aiAnalysis = json.data;
                        }
                    } catch (e) {
                        console.error('AI Analysis error', e);
                    }
                },

                openAiTrackerModal(projectId = null) {
                    this.modals.aiTracker = true;
                    this.fetchAiAnalysis();
                    if (projectId) {
                        this.aiTrackerTab = 'project';
                        this.onSelectAiProject(projectId);
                    } else {
                        this.aiTrackerTab = 'summary';
                    }
                },

                async onSelectAiProject(id) {
                    if (!id) {
                        this.aiProjectAnalysis = null;
                        this.aiSelectedProjectId = '';
                        return;
                    }
                    this.aiSelectedProjectId = id;
                    this.aiLoading = true;
                    try {
                        const res = await fetch(`api.php?action=ai_project_analysis&id=${id}`);
                        const json = await res.json();
                        if (json.success) {
                            this.aiProjectAnalysis = json.data;
                        }
                    } catch (e) {
                        console.error('Project AI analysis error', e);
                    } finally {
                        this.aiLoading = false;
                    }
                },

                async runAiSimulation() {
                    if (!this.aiSimForm.project_id || !this.aiSimForm.amount || parseFloat(this.aiSimForm.amount) <= 0) {
                        this.showToast('Pilih proyek dan masukkan nominal simulasi (> 0).', true);
                        return;
                    }
                    this.aiSimLoading = true;
                    try {
                        const res = await fetch('api.php?action=ai_validate_payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(this.aiSimForm)
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.aiSimResult = json.data;
                        } else {
                            this.showToast(json.message, true);
                        }
                    } catch (e) {
                        this.showToast('Gagal menjalankan simulasi AI.', true);
                    } finally {
                        this.aiSimLoading = false;
                    }
                },

                applySimulationToPayment() {
                    if (!this.aiSimForm.project_id) return;
                    const p = this.projects.find(item => item.project_id == this.aiSimForm.project_id);
                    if (!p) return;
                    this.modals.aiTracker = false;
                    if (this.aiSimForm.type === 'CLIENT_PAYMENT') {
                        this.openAddPaymentModal(p);
                        this.formPayment.amount_paid = this.aiSimForm.amount;
                    } else {
                        this.openTeamModal(p);
                        if (this.aiSimForm.member_id) {
                            this.memberPayAmounts[this.aiSimForm.member_id] = this.aiSimForm.amount;
                        }
                    }
                    this.showToast('Parameter simulasi AI diterapkan ke form pencatatan.');
                },

                handleAiAction(issue) {
                    const p = this.projects.find(item => item.project_id == issue.project_id);
                    this.modals.aiTracker = false;
                    if (!p) return;
                    if (issue.action_type === 'OPEN_WA') {
                        this.openWaModal(p);
                    } else if (issue.action_type === 'OPEN_TEAM') {
                        this.openTeamModal(p);
                    } else if (issue.action_type === 'VIEW_DETAIL') {
                        this.openDetailModal(p);
                    } else if (issue.action_type === 'EDIT_NOTES') {
                        this.openEditNotes(p);
                    }
                },

                getFilteredAiAnomalies() {
                    if (!this.aiAnalysis || !this.aiAnalysis.anomalies) return [];
                    if (this.aiIssueFilter === 'all') return this.aiAnalysis.anomalies;
                    return this.aiAnalysis.anomalies.filter(a => a.severity === this.aiIssueFilter);
                },

                getProjectAiBadge(projectId) {
                    if (!this.aiAnalysis || !this.aiAnalysis.project_audits) {
                        return { label: 'AI Aman', icon: '', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' };
                    }
                    const audit = this.aiAnalysis.project_audits.find(a => a.project_id == projectId);
                    if (!audit || audit.issues.length === 0) {
                        return { label: 'AI Aman', icon: '', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' };
                    }
                    const crit = audit.issues.find(i => i.severity === 'CRITICAL');
                    if (crit) {
                        let txt = crit.type === 'CASH_DEFICIT' ? 'AI: Defisit Kas' : (crit.type === 'CLIENT_OVERPAY' ? 'AI: Overpay' : 'AI: Kritis');
                        return { label: txt, icon: '', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800' };
                    }
                    const warn = audit.issues.find(i => i.severity === 'WARNING');
                    if (warn) {
                        let txt = 'AI: Perhatian';
                        if (warn.type && warn.type.includes('DUPLICATE')) txt = 'AI: Duplikasi?';
                        else if (warn.type && warn.type.includes('DEADLINE')) txt = 'AI: Deadline';
                        return { label: txt, icon: '', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800' };
                    }
                    return { label: 'AI: Siap Bayar', icon: '', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800' };
                },

                getClientPaymentAiWarning() {
                    if (!this.formPayment.amount_paid || parseFloat(this.formPayment.amount_paid) <= 0) return null;
                    const amount = parseFloat(this.formPayment.amount_paid);
                    const p = this.activeProject || (this.projects ? this.projects.find(item => item.project_id == this.formPayment.project_id) : null);
                    if (!p) return null;
                    const receivable = parseFloat(p.client_receivable_remaining) || 0;
                    
                    if (amount > receivable && receivable > 0) {
                        const selisih = amount - receivable;
                        return {
                            icon: '',
                            title: 'Peringatan AI Tracker: Kelebihan Bayar!',
                            desc: `Nominal ${this.formatRupiah(amount)} melebihi sisa piutang (${this.formatRupiah(receivable)}). Terjadi potensi selisih lebih bayar sebesar +${this.formatRupiah(selisih)}.`,
                            boxClass: 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300'
                        };
                    } else if (amount === receivable && receivable > 0) {
                        return {
                            icon: '',
                            title: 'Analisis AI: Pelunasan Tuntas (100%)',
                            desc: `Nominal ini tepat melunasi seluruh sisa kontrak proyek ${p.project_name}. Status proyek akan menjadi Lunas (Hijau).`,
                            boxClass: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300'
                        };
                    } else if (amount < receivable) {
                        const sisaNanti = receivable - amount;
                        return {
                            icon: '',
                            title: 'Analisis AI: Termin Progres Valid',
                            desc: `Pembayaran cicilan aman. Sisa piutang setelah transaksi ini: ${this.formatRupiah(sisaNanti)}.`,
                            boxClass: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300'
                        };
                    }
                    return null;
                },

                getTeamPaymentAiWarning(member) {
                    const raw = this.memberPayAmounts[member.id];
                    if (!raw || parseFloat(raw) <= 0) return null;
                    const amount = parseFloat(raw);
                    const remHonor = parseFloat(member.remaining_honor) || 0;
                    const netCash = this.activeProject ? (parseFloat(this.activeProject.net_cash_in_hand) || 0) : 0;

                    if (amount > remHonor && remHonor > 0) {
                        const selisih = amount - remHonor;
                        return {
                            icon: '',
                            text: `Melebihi sisa plafon honor tim (+${this.formatRupiah(selisih)})! Maksimal: ${this.formatRupiah(remHonor)}`,
                            boxClass: 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300'
                        };
                    }
                    if (amount > netCash) {
                        const selisihDef = amount - netCash;
                        return {
                            icon: '',
                            text: `Kas proyek tidak mencukupi (uang di tangan: ${this.formatRupiah(netCash)}). Akan terjadi defisit talangan kas -${this.formatRupiah(selisihDef)}!`,
                            boxClass: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-300'
                        };
                    }
                    return null;
                },

                // =====================================================
                // Gemini AI Methods (Key Management, Prompting, Chat)
                // =====================================================
                async fetchGeminiKeyStatus() {
                    const localKey = localStorage.getItem('gemini_api_key');
                    if (localKey && localKey.length > 5) {
                        this.geminiApiKey = localKey;
                        this.geminiHasKey = true;
                        this.geminiSavedKeyMasked = localKey.substring(0, 4) + '••••••••' + localKey.substring(localKey.length - 4);
                    }

                    try {
                        const res = await fetch('api.php?action=get_gemini_key');
                        const json = await res.json();
                        if (json.success && json.data.has_key) {
                            this.geminiHasKey = true;
                            this.geminiSavedKeyMasked = json.data.masked_key;
                        }
                    } catch (e) {
                        console.error('Fetch gemini key status error', e);
                    }
                },

                async saveGeminiKey() {
                    const keyToSave = this.geminiApiKey.trim();
                    try {
                        const res = await fetch('api.php?action=save_gemini_key', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ api_key: keyToSave })
                        });
                        const json = await res.json();
                        if (json.success) {
                            if (keyToSave) {
                                localStorage.setItem('gemini_api_key', keyToSave);
                                this.geminiHasKey = true;
                                this.geminiSavedKeyMasked = keyToSave.substring(0, 4) + '••••••••' + keyToSave.substring(keyToSave.length - 4);
                                this.showToast('Google Gemini API Key berhasil disimpan!');
                            } else {
                                localStorage.removeItem('gemini_api_key');
                                this.geminiHasKey = false;
                                this.geminiSavedKeyMasked = '';
                                this.showToast('Google Gemini API Key dihapus.');
                            }
                        } else {
                            this.showToast(json.message || 'Gagal menyimpan key.', true);
                        }
                    } catch (e) {
                        this.showToast('Gagal menghubungi server.', true);
                    }
                },

                async testGeminiKey() {
                    this.geminiTesting = true;
                    try {
                        const res = await fetch('api.php?action=test_gemini_key', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ api_key: this.geminiApiKey.trim() })
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.showToast('Koneksi Google Gemini API Berhasil! (Model ' + (json.data ? json.data.model : 'Gemini') + ')');
                        } else {
                            this.showToast(json.message || 'Koneksi Gemini gagal.', true);
                        }
                    } catch (e) {
                        this.showToast('Gagal menguji koneksi API.', true);
                    } finally {
                        this.geminiTesting = false;
                    }
                },

                async sendGeminiPrompt(customText = null) {
                    const text = (customText !== null ? customText : this.geminiPromptInput).trim();
                    if (!text || this.geminiLoading) return;

                    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    this.geminiConversation.push({
                        role: 'user',
                        text: text,
                        time: nowStr
                    });

                    if (customText === null) {
                        this.geminiPromptInput = '';
                    }

                    this.geminiLoading = true;

                    const history = this.geminiConversation
                        .filter(m => !m.isError)
                        .map(m => ({ role: m.role, text: m.text }));

                    try {
                        const res = await fetch('api.php?action=gemini_prompt', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                prompt: text,
                                history: history,
                                api_key: this.geminiApiKey ? this.geminiApiKey.trim() : '',
                                include_context: this.geminiIncludeContext
                            })
                        });
                        const json = await res.json();

                        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        if (json.success) {
                            this.geminiConversation.push({
                                role: 'model',
                                text: json.data.reply,
                                time: replyTime
                            });
                        } else {
                            this.geminiConversation.push({
                                role: 'model',
                                text: '[Error] ' + (json.message || 'Gagal memproses prompt.'),
                                time: replyTime,
                                isError: true
                            });
                        }
                    } catch (e) {
                        this.geminiConversation.push({
                            role: 'model',
                            text: '[Error] Terjadi kesalahan jaringan saat menghubungi API Gemini.',
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            isError: true
                        });
                    } finally {
                        this.geminiLoading = false;
                    }
                },

                copyToClipboard(text) {
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(text).then(() => {
                            this.showToast('Jawaban AI disalin ke papan klip!');
                        });
                    }
                },

                renderMarkdown(text) {
                    if (!text) return '';
                    let html = text
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;');

                    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
                    html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">$1</code>');
                    html = html.replace(/^### (.*$)/gim, '<h5 class="font-extrabold text-sm text-slate-900 dark:text-white mt-2 mb-1">$1</h5>');
                    html = html.replace(/^## (.*$)/gim, '<h4 class="font-extrabold text-base text-slate-900 dark:text-white mt-2.5 mb-1">$1</h4>');
                    html = html.replace(/^\s*[-•*]\s+(.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
                    html = html.replace(/\n/g, '<br>');

                    return html;
                }
            }
        }
    </script>
</body>
</html>
