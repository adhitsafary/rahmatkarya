<?php
// =====================================================================
// DASHBOARD CLIENT: Portal Monitoring & Transparansi Klien ProCash
// Sesuai Diagram Flowchart:
//   - Menampilkan project, DP, Harga, Tanggal mulai - akhir
//   - Sistem pembayaran manual (dalam uang riil Rupiah)
//   - Revisi (Revisi mayor 3-5x) & tombol Deal revisi
//   - Progres (Ada visual chart)
//   - PDF dan Auto kirim ke WA dan email
// =====================================================================

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/auth.php';

$token = trim($_GET['token'] ?? '');
$projectId = (int)($_GET['id'] ?? 0);
$currentUser = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="id" x-data="procashClientPortal()" :class="{ 'dark': isDarkMode }" x-init="initPortal()">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Dashboard Klien - Rahmat-Karya</title>
    <!-- Favicon & Brand Icons -->
    <link rel="icon" type="image/png" sizes="32x32" href="./favicon-32x32.png?v=4">
    <link rel="icon" type="image/svg+xml" href="./favicon.svg?v=4">
    <link rel="shortcut icon" href="./favicon.ico?v=4">
    <link rel="apple-touch-icon" href="./apple-touch-icon.png?v=4">
    <!-- Tailwind CSS -->
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
                            dark: '#0F172A'
                        }
                    }
                }
            }
        }
    </script>
    <!-- Alpine.js -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>
    <!-- Google Fonts -->
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
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 9999px; }
        .dark ::-webkit-scrollbar-thumb { background: #334155; }
    </style>
</head>
<body class="bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 min-h-screen antialiased selection:bg-slate-900 selection:text-white transition-colors duration-200">

    <!-- Toast Notification -->
    <div x-cloak x-show="toast.show" 
         x-transition:enter="transition ease-out duration-300"
         x-transition:enter-start="opacity-0 transform translate-y-4 scale-95"
         x-transition:enter-end="opacity-100 transform translate-y-0 scale-100"
         x-transition:leave="transition ease-in duration-200"
         x-transition:leave-start="opacity-100 transform translate-y-0 scale-100"
         x-transition:leave-end="opacity-0 transform translate-y-4 scale-95"
         class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold border backdrop-blur-md"
         :class="toast.isError ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30' : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/30 dark:bg-white dark:text-slate-900'">
        <span x-text="toast.isError ? 'ERR' : 'OK'" class="text-[9px] font-black px-1.5 py-0.5 rounded" :class="toast.isError ? 'bg-white/20 text-white' : 'bg-emerald-500 text-white'"></span>
        <span x-text="toast.message"></span>
    </div>

    <!-- App Shell Container (Sidebar + Content) -->
    <div class="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        
        <!-- ============================================================= -->
        <!-- 1. SIMPLE & MINIMALIST CLIENT SIDEBAR                         -->
        <!-- ============================================================= -->
        
        <!-- Mobile Backdrop -->
        <div x-cloak x-show="sidebarOpen" @click="sidebarOpen = false"
             x-transition:enter="transition-opacity ease-linear duration-200"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="transition-opacity ease-linear duration-200"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"></div>

        <!-- Sidebar Aside -->
        <aside :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
               class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shrink-0 shadow-lg lg:shadow-none">
            
            <!-- Top Section: Brand & Navigation -->
            <div class="flex-1 flex flex-col min-h-0">
                
                <!-- Brand Header -->
                <div class="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center font-black text-xs">
                            RK
                        </div>
                        <div>
                            <span class="font-bold text-sm text-slate-900 dark:text-white tracking-tight">Rahmat-Karya</span>
                            <span class="text-[10px] text-slate-400 block font-medium">Portal Klien</span>
                        </div>
                    </div>

                    <!-- Mobile Close Button -->
                    <button @click="sidebarOpen = false" class="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <!-- Navigation Content -->
                <nav class="flex-1 p-4 space-y-4 overflow-y-auto text-xs">
                    
                    <!-- Compact Active Project Summary -->
                    <template x-if="project">
                        <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proyek</span>
                                <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold"
                                      :class="project.workflow_step === 'DONE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'"
                                      x-text="project.workflow_step || 'KONTRAK'"></span>
                            </div>
                            <div>
                                <h4 class="text-xs font-bold text-slate-900 dark:text-white truncate" x-text="project.project_name"></h4>
                                <p class="text-[10px] text-slate-400 font-mono mt-0.5 truncate" x-text="project.contract_number || project.project_code"></p>
                            </div>
                            <div class="pt-1.5 border-t border-slate-200/60 dark:border-slate-800/80">
                                <div class="flex justify-between text-[10px] font-medium text-slate-500 mb-1">
                                    <span>Progres</span>
                                    <span class="font-mono font-bold text-slate-900 dark:text-white" x-text="project.progress_percent + '%'"></span>
                                </div>
                                <div class="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                    <div class="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500" :style="`width: ${project.progress_percent}%`"></div>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Simple Clean Menu Links (Only 3 essential items) -->
                    <div class="space-y-1">
                        <span class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Menu</span>
                        
                        <a href="#section-hero" @click="sidebarOpen = false"
                           class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition">
                            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                            <span>Ringkasan Proyek</span>
                        </a>

                        <a href="#section-termin" @click="sidebarOpen = false"
                           class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition">
                            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <span>Jadwal & Pembayaran</span>
                        </a>

                        <a href="#section-revisi" @click="sidebarOpen = false"
                           class="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition">
                            <div class="flex items-center gap-2.5">
                                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                                <span>Revisi & Kesepakatan</span>
                            </div>
                            <template x-if="project">
                                <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                      x-text="(project.current_revision || 0) + '/' + (project.max_revisions || 3)"></span>
                            </template>
                        </a>
                    </div>

                    <!-- Clean Quick Utilities -->
                    <div class="space-y-1 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <span class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dokumen & Bantuan</span>

                        <template x-if="project">
                            <a :href="'export.php?id=' + project.project_id" target="_blank"
                               class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition">
                                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                                <span>Cetak Rekap PDF</span>
                            </a>
                        </template>

                        <button @click="openWaModal(); sidebarOpen = false;"
                                class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition text-left">
                            <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                            <span>Hubungi Tim via WA</span>
                        </button>
                    </div>

                </nav>
            </div>

            <!-- Sidebar Bottom: Client Identity & Theme Switcher -->
            <div class="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5 min-w-0">
                        <div class="w-8 h-8 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                            <span x-text="project ? getInitials(project.client_name) : 'K'"></span>
                        </div>
                        <div class="min-w-0">
                            <p class="font-bold text-xs text-slate-900 dark:text-white truncate" x-text="project ? project.client_name : 'Klien'"></p>
                            <span class="text-[10px] text-slate-400 font-medium">Portal Klien</span>
                        </div>
                    </div>

                    <button @click="isDarkMode = !isDarkMode" 
                            class="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center"
                            :title="isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'"
                            aria-label="Toggle Mode Gelap/Terang">
                        <template x-if="isDarkMode">
                            <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        </template>
                        <template x-if="!isDarkMode">
                            <svg class="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                        </template>
                    </button>
                </div>
            </div>

        </aside>

        <!-- ============================================================= -->
        <!-- 2. MAIN APPLICATION CONTENT AREA (CLEAN & EASY TO READ)       -->
        <!-- ============================================================= -->
        <div class="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
            
            <!-- Top Header Bar -->
            <header class="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors shrink-0">
                
                <!-- Left: Hamburger (Mobile) + Project Name -->
                <div class="flex items-center gap-3">
                    <button @click="sidebarOpen = true" 
                            class="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                            title="Buka Menu Sidebar">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                    </button>

                    <div class="flex items-center gap-2">
                        <h2 class="font-bold text-sm text-slate-900 dark:text-white" x-text="project ? project.project_name : 'Dashboard Klien'"></h2>
                        <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold text-[10px]">
                            Portal Klien
                        </span>
                    </div>
                </div>

                <!-- Right: Project Switcher & Direct Admin Link -->
                <div class="flex items-center gap-2 sm:gap-3">
                    
                    <!-- Project Selector Dropdown -->
                    <div class="relative" x-data="{ open: false }">
                        <button @click="open = !open" 
                                class="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400 transition">
                            <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            <span class="max-w-[120px] sm:max-w-[180px] truncate" x-text="project ? project.project_name : 'Pilih Proyek...'"></span>
                            <span class="text-[9px] text-slate-400">▼</span>
                        </button>
                        <div x-cloak x-show="open" @click.away="open = false" 
                             class="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 text-xs">
                            <div class="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400">Pilih Proyek:</div>
                            <template x-for="p in projectList" :key="p.id">
                                <button @click="switchProject(p.id, p.client_access_token); open = false;"
                                        class="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
                                        :class="project && project.project_id == p.id ? 'bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300 font-medium'">
                                    <div class="truncate">
                                        <div x-text="p.project_name" class="font-bold truncate"></div>
                                        <div class="text-[10px] text-slate-400 font-mono" x-text="p.contract_number || p.project_code"></div>
                                    </div>
                                    <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold"
                                          :class="p.workflow_step === 'DONE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'"
                                          x-text="p.workflow_step"></span>
                                </button>
                            </template>
                        </div>
                    </div>

                    <!-- Link to Admin Panel -->
                    <a href="index.html" 
                       class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition">
                        <span>Panel Admin</span>
                        <span>&rarr;</span>
                    </a>
                </div>

            </header>

            <!-- Main Scrollable Dashboard Content -->
            <main class="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl w-full mx-auto">

                <!-- Loading State -->
                <div x-show="loading" class="text-center py-20">
                    <div class="inline-block w-8 h-8 border-4 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin mb-3"></div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Memuat Data Proyek...</p>
                </div>

                <div x-show="!loading && project" class="space-y-6">

                    <!-- ============================================================= -->
                    <!-- 1. CLEAN UNIFIED HERO CARD                                    -->
                    <!-- ============================================================= -->
                    <div id="section-hero" class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm">
                        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                            
                            <!-- Left: Project Info -->
                            <div class="space-y-2 max-w-2xl">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                        <span x-text="project.contract_number || project.project_code"></span>
                                    </span>
                                    <span class="text-slate-300 dark:text-slate-700">•</span>
                                    <span class="text-xs text-slate-400 font-medium" x-text="'Mulai: ' + formatDate(project.start_date)"></span>
                                </div>

                                <h1 class="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight" x-text="project.project_name"></h1>
                                <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-normal" x-text="project.project_detail || project.notes || 'Portal transparansi proyek dan informasi termin pembayaran.'"></p>

                                <div class="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                                    <span>Klien: <strong class="text-slate-800 dark:text-slate-200" x-text="project.client_name"></strong></span>
                                    <span x-show="project.client_phone">•</span>
                                    <span x-show="project.client_phone" class="font-mono" x-text="project.client_phone"></span>
                                </div>
                            </div>

                            <!-- Right: Clean Action Buttons -->
                            <div class="flex items-center gap-2.5 shrink-0 flex-wrap">
                                <a :href="'export.php?id=' + project.project_id" target="_blank"
                                   class="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white font-bold text-xs shadow-sm transition flex items-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                                    <span>Cetak PDF</span>
                                </a>

                                <button @click="openWaModal()"
                                        class="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1.5">
                                    <span>Kirim WA</span>
                                </button>

                                <button @click="copyPortalUrl()"
                                        class="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs transition flex items-center gap-1.5"
                                        title="Salin Tautan Portal">
                                    <span>Salin Link</span>
                                </button>
                            </div>

                        </div>
                    </div>

                    <!-- ============================================================= -->
                    <!-- 2. CLEAN PROGRESS STEPPER (Flowchart Milestones)              -->
                    <!-- ============================================================= -->
                    <div id="section-pipeline" class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-400">Tahapan Pengerjaan Proyek</h3>
                            <span class="text-xs font-bold font-mono text-blue-600 dark:text-blue-400" x-text="getWorkflowLabel(project.workflow_step)"></span>
                        </div>

                        <!-- Clean Stepper Milestone Track -->
                        <div class="grid grid-cols-5 gap-2 sm:gap-3 text-center">
                            
                            <!-- 1. Kontrak & DP -->
                            <div class="p-2.5 sm:p-3 rounded-2xl border transition"
                                 :class="isStepActiveOrDone(1) ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60' : 'bg-slate-50/40 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800 text-slate-400'">
                                <span class="text-[10px] font-bold block" :class="isStepActiveOrDone(1) ? 'text-blue-600' : 'text-slate-400'">1. Kontrak</span>
                                <span class="text-xs font-bold text-slate-900 dark:text-white hidden sm:block mt-0.5">DP Awal</span>
                            </div>

                            <!-- 2. Pengerjaan Fitur -->
                            <div class="p-2.5 sm:p-3 rounded-2xl border transition"
                                 :class="isStepActiveOrDone(2) ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60' : 'bg-slate-50/40 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800 text-slate-400'">
                                <span class="text-[10px] font-bold block" :class="isStepActiveOrDone(2) ? 'text-blue-600' : 'text-slate-400'">2. Pengerjaan</span>
                                <span class="text-xs font-bold text-slate-900 dark:text-white hidden sm:block mt-0.5" x-text="project.progress_percent + '% Fisik'"></span>
                            </div>

                            <!-- 3. Revisi s/d Deal -->
                            <div class="p-2.5 sm:p-3 rounded-2xl border transition"
                                 :class="isStepActiveOrDone(3) ? (project.revision_deal_status === 'DEAL_APPROVED' ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700' : 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 text-amber-700') : 'bg-slate-50/40 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800 text-slate-400'">
                                <span class="text-[10px] font-bold block">3. Revisi</span>
                                <span class="text-xs font-bold hidden sm:block mt-0.5" x-text="project.revision_deal_status === 'DEAL_APPROVED' ? 'Deal Disetujui' : project.current_revision + '/' + project.max_revisions"></span>
                            </div>

                            <!-- 4. Pelunasan -->
                            <div class="p-2.5 sm:p-3 rounded-2xl border transition"
                                 :class="isStepActiveOrDone(4) ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/60' : 'bg-slate-50/40 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800 text-slate-400'">
                                <span class="text-[10px] font-bold block" :class="isStepActiveOrDone(4) ? 'text-blue-600' : 'text-slate-400'">4. Pembayaran</span>
                                <span class="text-xs font-bold text-slate-900 dark:text-white hidden sm:block mt-0.5">Pelunasan</span>
                            </div>

                            <!-- 5. Selesai -->
                            <div class="p-2.5 sm:p-3 rounded-2xl border transition"
                                 :class="isStepCurrent(5) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50/40 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800 text-slate-400'">
                                <span class="text-[10px] font-bold block" :class="isStepCurrent(5) ? 'text-white' : 'text-slate-400'">5. Tuntas</span>
                                <span class="text-xs font-bold hidden sm:block mt-0.5" :class="isStepCurrent(5) ? 'text-white' : 'text-slate-900 dark:text-white'">Selesai</span>
                            </div>

                        </div>
                    </div>

                    <!-- ============================================================= -->
                    <!-- 3. 4 KEY METRIC CARDS (Clean Minimalist Fintech)              -->
                    <!-- ============================================================= -->
                    <div id="section-metrics" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        <!-- 1: Total Kontrak -->
                        <div class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <span class="text-[11px] font-medium text-slate-400 block mb-1">Total Nilai Kontrak</span>
                            <div class="text-2xl font-black text-slate-900 dark:text-white font-mono" x-text="formatRupiah(project.total_contract_value)"></div>
                            <div class="mt-2 text-xs text-slate-500 flex items-center justify-between">
                                <span>DP Awal:</span>
                                <strong class="text-emerald-600 dark:text-emerald-400 font-mono" x-text="formatRupiah(project.total_dp_paid || 0)"></strong>
                            </div>
                        </div>

                        <!-- 2: Sisa Tagihan -->
                        <div class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <span class="text-[11px] font-medium text-slate-400 block mb-1">Sisa Tagihan</span>
                            <div class="text-2xl font-black font-mono" 
                                 :class="project.client_receivable_remaining <= 0 ? 'text-emerald-600' : 'text-slate-900 dark:text-white'"
                                 x-text="formatRupiah(project.client_receivable_remaining)"></div>
                            <div class="mt-2 text-xs text-slate-500 flex items-center justify-between">
                                <span>Status:</span>
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                                      :class="project.client_receivable_remaining <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'"
                                      x-text="project.client_receivable_remaining <= 0 ? 'LUNAS' : 'MENUNGGU'"></span>
                            </div>
                        </div>

                        <!-- 3: Durasi & Deadline -->
                        <div class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <span class="text-[11px] font-medium text-slate-400 block mb-1">Target Penyelesaian</span>
                            <div class="text-xl font-black text-slate-900 dark:text-white" x-text="formatDate(project.deadline_date)"></div>
                            <div class="mt-2 text-xs text-slate-500 flex items-center justify-between">
                                <span>Mulai: <span class="font-medium" x-text="formatDate(project.start_date)"></span></span>
                                <span class="text-blue-600 dark:text-blue-400 font-semibold" x-text="project.days_left_to_deadline > 0 ? project.days_left_to_deadline + ' hari lagi' : 'Deadline'"></span>
                            </div>
                        </div>

                        <!-- 4: Kuota Revisi -->
                        <div class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                            <span class="text-[11px] font-medium text-slate-400 block mb-1">Kuota Revisi Mayor</span>
                            <div class="text-2xl font-black text-slate-900 dark:text-white font-mono">
                                <span x-text="project.current_revision"></span> / <span x-text="project.max_revisions"></span>
                            </div>
                            <div class="mt-2 text-xs text-slate-500 flex items-center justify-between">
                                <span>Status:</span>
                                <span class="font-bold" 
                                      :class="project.revision_deal_status === 'DEAL_APPROVED' ? 'text-emerald-600' : 'text-amber-600'"
                                      x-text="project.revision_deal_status === 'DEAL_APPROVED' ? 'DEAL' : project.remaining_revisions + ' kuota sisa'"></span>
                            </div>
                        </div>

                    </div>

                    <!-- ============================================================= -->
                    <!-- 4. TWO-COLUMN LAYOUT: PEMBAYARAN & REVISI                     -->
                    <!-- ============================================================= -->
                    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        <!-- LEFT COLUMN: Progres & Termin Pembayaran (7 Kolom) -->
                        <div class="lg:col-span-7 space-y-6">
                            
                            <!-- CARD: PROGRES PENGERJAAN & PEMBAYARAN -->
                            <div id="section-progres" class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                                <div class="flex items-center justify-between border-b pb-3 mb-4 border-slate-100 dark:border-slate-800">
                                    <h3 class="text-sm font-bold text-slate-900 dark:text-white">Progres Fisik & Visual Arus Kas</h3>
                                    <span class="text-xs font-mono font-bold text-blue-600" x-text="project.progress_percent + '% Fisik'"></span>
                                </div>

                                <!-- Visual Realization Chart Hub -->
                                <div class="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 mb-4">
                                    <!-- SVG Circular Donut Chart for Payment Realization -->
                                    <div class="relative w-24 h-24 shrink-0 flex items-center justify-center">
                                        <svg class="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="currentColor" stroke-width="3.2" class="text-slate-200 dark:text-slate-700"></circle>
                                            <circle cx="18" cy="18" r="15.9155" fill="transparent" stroke="#10B981" stroke-width="3.4"
                                                    :stroke-dasharray="`${project.client_payment_progress_percent || 0} ${100 - (project.client_payment_progress_percent || 0)}`"
                                                    stroke-dashoffset="0"
                                                    stroke-linecap="round"
                                                    class="transition-all duration-700"></circle>
                                        </svg>
                                        <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                                            <span class="text-base font-black font-mono text-slate-900 dark:text-white" x-text="(project.client_payment_progress_percent || 0) + '%'"></span>
                                            <span class="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Terbayar</span>
                                        </div>
                                    </div>

                                    <!-- Quick Breakdown Rows -->
                                    <div class="flex-1 min-w-0 space-y-1.5 text-xs w-full">
                                        <div class="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                            <span>Kas Masuk (DP & Termin):</span>
                                            <strong class="font-mono text-emerald-600 dark:text-emerald-400 font-bold" x-text="formatRupiah(project.total_paid_by_client)"></strong>
                                        </div>
                                        <div class="flex justify-between items-center text-slate-600 dark:text-slate-300">
                                            <span>Sisa Tagihan Pelunasan:</span>
                                            <strong class="font-mono font-bold" :class="project.client_receivable_remaining > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'" x-text="project.client_receivable_remaining > 0 ? formatRupiah(project.client_receivable_remaining) : 'Rp 0 (LUNAS)'"></strong>
                                        </div>
                                        <div class="flex justify-between items-center pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-500 text-[11px]">
                                            <span>Target Penyelesaian:</span>
                                            <span class="font-mono font-semibold text-slate-800 dark:text-slate-200" x-text="formatDate(project.deadline_date) + (project.days_left_to_deadline > 0 ? ' (' + project.days_left_to_deadline + ' hari lagi)' : '')"></span>
                                        </div>
                                    </div>
                                </div>

                                <div class="space-y-4">
                                    <!-- Fisik Progress -->
                                    <div>
                                        <div class="flex justify-between text-xs font-medium mb-1 text-slate-600 dark:text-slate-300">
                                            <span>Pengerjaan Desain & Gambar Kerja</span>
                                            <span class="font-mono font-bold" x-text="project.progress_percent + '%'"></span>
                                        </div>
                                        <div class="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div class="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500" :style="'width: ' + project.progress_percent + '%'"></div>
                                        </div>
                                    </div>

                                    <!-- Pembayaran Progress -->
                                    <div>
                                        <div class="flex justify-between text-xs font-medium mb-1 text-slate-600 dark:text-slate-300">
                                            <span>Pembayaran Diterima</span>
                                            <span class="font-mono font-bold text-emerald-600" x-text="project.client_payment_progress_percent + '%'"></span>
                                        </div>
                                        <div class="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" :style="'width: ' + project.client_payment_progress_percent + '%'"></div>
                                        </div>
                                        <div class="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                                            <span x-text="formatRupiah(project.total_paid_by_client)"></span>
                                            <span x-text="'Total: ' + formatRupiah(project.total_contract_value)"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- CARD: SISTEM PEMBAYARAN TERMIN (Nominal Uang Riil) -->
                            <div id="section-termin" class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                                <div class="flex items-center justify-between border-b pb-3 mb-4 border-slate-100 dark:border-slate-800">
                                    <div>
                                        <h3 class="text-sm font-bold text-slate-900 dark:text-white">Jadwal Pembayaran Termin</h3>
                                        <p class="text-xs text-slate-400">Rincian nominal uang yang disepakati</p>
                                    </div>
                                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                                        Nominal Riil
                                    </span>
                                </div>

                                <!-- Terms Table -->
                                <div class="overflow-x-auto">
                                    <table class="w-full text-left text-xs">
                                        <thead>
                                            <tr class="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                                                <th class="py-2.5">Termin</th>
                                                <th class="py-2.5">Jatuh Tempo</th>
                                                <th class="py-2.5 text-right">Nominal (Rp)</th>
                                                <th class="py-2.5 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                            <template x-for="term in paymentTerms" :key="term.id">
                                                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                                                    <td class="py-3">
                                                        <div class="font-bold text-slate-900 dark:text-white" x-text="term.term_name"></div>
                                                        <div class="text-[10px] text-slate-400 font-normal" x-text="term.notes || '-'"></div>
                                                    </td>
                                                    <td class="py-3 text-slate-500 font-mono" x-text="formatDate(term.due_date)"></td>
                                                    <td class="py-3 text-right font-mono font-bold text-slate-900 dark:text-white" x-text="formatRupiah(term.amount)"></td>
                                                    <td class="py-3 text-center">
                                                        <span class="px-2 py-0.5 rounded text-[10px] font-bold font-mono"
                                                              :class="term.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'"
                                                              x-text="term.status === 'PAID' ? 'LUNAS' : 'MENUNGGU'"></span>
                                                    </td>
                                                </tr>
                                            </template>
                                        </tbody>
                                        <tfoot>
                                            <tr class="border-t border-slate-200 dark:border-slate-800 font-bold">
                                                <td colspan="2" class="py-3 text-slate-700 dark:text-slate-300">Total Termin</td>
                                                <td class="py-3 text-right font-mono text-sm text-slate-900 dark:text-white" x-text="formatRupiah(totalTermsAmount())"></td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                        </div>

                        <!-- RIGHT COLUMN: Revisi & Kesepakatan Deal (5 Kolom) -->
                        <div class="lg:col-span-5 space-y-6">
                            
                            <!-- CARD: MANAJEMEN & KUOTA REVISI -->
                            <div id="section-revisi" class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                                <div class="flex items-center justify-between border-b pb-3 mb-4 border-slate-100 dark:border-slate-800">
                                    <h3 class="text-sm font-bold text-slate-900 dark:text-white">Status Revisi & Persetujuan</h3>
                                    <span class="text-xs font-mono font-bold text-slate-700 dark:text-slate-300"
                                          x-text="project.current_revision + ' / ' + project.max_revisions + ' Kuota'"></span>
                                </div>

                                <!-- Status Box -->
                                <div class="p-3.5 rounded-2xl mb-4 text-xs font-medium"
                                     :class="project.revision_deal_status === 'DEAL_APPROVED' ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-800 dark:text-emerald-300' : 'bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'">
                                    <template x-if="project.revision_deal_status === 'DEAL_APPROVED'">
                                        <div class="font-bold text-emerald-800 dark:text-emerald-300">
                                            Hasil pekerjaan telah disetujui (DEAL). Menuju tahap pembayaran akhir.
                                        </div>
                                    </template>
                                    <template x-if="project.revision_deal_status !== 'DEAL_APPROVED'">
                                        <div class="flex items-center justify-between">
                                            <span>Tersisa <strong class="text-slate-900 dark:text-white" x-text="project.remaining_revisions"></strong> kali kuota revisi mayor.</span>
                                            <button @click="modals.newRevision = true" class="text-xs font-bold text-blue-600 hover:underline">+ Ajukan Revisi</button>
                                        </div>
                                    </template>
                                </div>

                                <!-- Primary Deal Button -->
                                <div x-show="project.revision_deal_status !== 'DEAL_APPROVED'" class="mb-4">
                                    <button @click="approveRevisionDeal()"
                                            class="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 transition flex items-center justify-center gap-2">
                                        <span>Setujui Hasil Proyek (DEAL FINAL)</span>
                                    </button>
                                    <p class="text-[10px] text-center text-slate-400 mt-1.5">Klik jika seluruh pengerjaan telah sesuai untuk lanjut ke pelunasan</p>
                                </div>

                                <!-- Revision History -->
                                <div class="space-y-2.5">
                                    <span class="text-[10px] uppercase font-bold text-slate-400 block">Riwayat Revisi:</span>
                                    
                                    <template x-if="revisions.length === 0">
                                        <div class="text-center py-4 text-slate-400 italic text-xs border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                                            Belum ada catatan revisi.
                                        </div>
                                    </template>

                                    <template x-for="rev in revisions" :key="rev.id">
                                        <div class="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1">
                                            <div class="flex items-center justify-between">
                                                <span class="font-bold text-xs text-slate-900 dark:text-white" x-text="'Revisi #' + rev.revision_number + ': ' + rev.title"></span>
                                                <span class="text-[10px] font-mono font-bold"
                                                      :class="rev.status === 'DEAL_APPROVED' ? 'text-emerald-600' : 'text-amber-600'"
                                                      x-text="rev.status"></span>
                                            </div>
                                            <p class="text-xs text-slate-500 font-normal" x-text="rev.description"></p>
                                            <div class="text-[10px] text-slate-400 pt-1">
                                                <span x-text="formatDate(rev.requested_date)"></span>
                                            </div>
                                        </div>
                                    </template>
                                </div>

                            </div>

                            <!-- CARD: BANTUAN WHATSAPP -->
                            <div class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
                                <div>
                                    <h4 class="text-xs font-bold text-slate-900 dark:text-white">Ada Pertanyaan atau Kendala?</h4>
                                    <p class="text-[11px] text-slate-400">Tim kami siap membantu Anda kapan saja</p>
                                </div>
                                <a :href="'https://wa.me/6281234567890?text=' + encodeURIComponent('Halo Tim Rahmat-Karya, saya ingin bertanya terkait proyek ' + (project.project_name || ''))" target="_blank"
                                   class="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-2 transition">
                                    <span>Hubungi Tim via WhatsApp</span>
                                </a>
                            </div>

                        </div>

                    </div>

                </div>

            </main>

        </div>

    </div>

    <!-- ============================================================= -->
    <!-- MODAL: AJUKAN REVISI BARU                                     -->
    <!-- ============================================================= -->
    <div x-cloak x-show="modals.newRevision" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div @click.away="modals.newRevision = false" class="rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border transition bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white">
            <div class="flex justify-between items-center border-b pb-4 mb-4 border-slate-100 dark:border-slate-800">
                <div>
                    <h3 class="text-base font-bold">Ajukan Revisi Mayor</h3>
                    <p class="text-xs text-slate-400" x-text="'Sisa Kuota: ' + project.remaining_revisions + ' kali'"></p>
                </div>
                <button @click="modals.newRevision = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <form @submit.prevent="submitClientRevision()" class="space-y-4 text-xs">
                <div>
                    <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Judul Bagian Revisi *</label>
                    <input type="text" x-model="formRev.title" required placeholder="Contoh: Penyesuaian Fasad Depan, Tampak & Denah Ruang" 
                           class="w-full text-xs font-semibold border rounded-xl px-3.5 py-2.5 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white focus:outline-none">
                </div>

                <div>
                    <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Catatan & Rincian Perbaikan *</label>
                    <textarea x-model="formRev.description" rows="4" required placeholder="Jelaskan secara rinci apa yang ingin diubah agar tim kami dapat menyelesaikan sesuai ekspektasi..." 
                              class="w-full text-xs font-medium border rounded-xl px-3.5 py-2.5 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white focus:outline-none"></textarea>
                </div>

                <div class="pt-2 flex justify-end gap-2.5">
                    <button type="button" @click="modals.newRevision = false" class="text-xs font-bold text-slate-400 hover:text-slate-700 px-4 py-2">Batal</button>
                    <button type="submit" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition">
                        Kirim Revisi
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- ============================================================= -->
    <!-- MODAL: PREVIEW & AUTO KIRIM WHATSAPP                          -->
    <!-- ============================================================= -->
    <div x-cloak x-show="modals.wa" class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <div @click.away="modals.wa = false" class="rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border transition bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white">
            <div class="flex justify-between items-center border-b pb-4 mb-4 border-slate-100 dark:border-slate-800">
                <h3 class="text-base font-bold">Kirim Rekap ke WhatsApp</h3>
                <button @click="modals.wa = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 text-sm font-bold">&times;</button>
            </div>

            <div class="space-y-4 text-xs">
                <div>
                    <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nomor WhatsApp Tujuan:</label>
                    <input type="text" x-model="targetPhone" placeholder="081234567890" 
                           class="w-full text-xs font-mono font-bold border rounded-xl px-3.5 py-2.5 bg-slate-50 border-slate-200 text-slate-900 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                </div>

                <div>
                    <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pratinjau Pesan:</label>
                    <textarea readonly rows="7" class="w-full text-xs font-mono border rounded-xl p-3 bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300" x-text="waMessage"></textarea>
                </div>

                <div class="pt-2 flex justify-end gap-2.5">
                    <button type="button" @click="modals.wa = false" class="text-xs font-bold text-slate-400 hover:text-slate-700 px-4 py-2">Batal</button>
                    <button type="button" @click="sendWhatsAppDirect()" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition">
                        Buka WhatsApp &rarr;
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Client Portal Application Script -->
    <script>
        function procashClientPortal() {
            return {
                isDarkMode: false,
                sidebarOpen: false,
                loading: true,
                project: null,
                paymentTerms: [],
                revisions: [],
                clientPayments: [],
                projectList: [],
                portalUrl: '',
                waMessage: '',
                waEncoded: '',
                emailSubjectRaw: '',
                emailBodyRaw: '',
                targetPhone: '',
                targetEmail: '',

                modals: {
                    newRevision: false,
                    wa: false
                },

                formRev: {
                    title: '',
                    description: ''
                },

                getInitials(name) {
                    if (!name) return 'K';
                    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                },

                toast: {
                    show: false,
                    message: '',
                    isError: false,
                    timeout: null
                },

                showToast(msg, isError = false) {
                    clearTimeout(this.toast.timeout);
                    this.toast.message = msg;
                    this.toast.isError = isError;
                    this.toast.show = true;
                    this.toast.timeout = setTimeout(() => {
                        this.toast.show = false;
                    }, 4000);
                },

                initPortal() {
                    const savedDark = localStorage.getItem('procash_dark');
                    if (savedDark !== null) {
                        this.isDarkMode = (savedDark === 'true');
                    }
                    this.$watch('isDarkMode', val => {
                        localStorage.setItem('procash_dark', val);
                    });

                    this.fetchProjectList();
                    this.loadData();
                },

                async fetchProjectList() {
                    try {
                        const res = await fetch('api.php?action=client_get_projects');
                        const json = await res.json();
                        if (json.success) {
                            this.projectList = json.data;
                        }
                    } catch (e) {
                        console.error('Error fetching project list', e);
                    }
                },

                async loadData(projId = null, tokenStr = null) {
                    this.loading = true;
                    try {
                        const urlParams = new URLSearchParams(window.location.search);
                        const id = projId || urlParams.get('id') || '1';
                        const token = tokenStr || urlParams.get('token') || '';

                        let endpoint = 'api.php?action=client_portal_data';
                        if (token) endpoint += '&token=' + encodeURIComponent(token);
                        else if (id) endpoint += '&id=' + encodeURIComponent(id);

                        const res = await fetch(endpoint);
                        const json = await res.json();

                        if (json.success && json.data) {
                            this.project = json.data.project;
                            this.paymentTerms = json.data.payment_terms || [];
                            this.revisions = json.data.revisions || [];
                            this.clientPayments = json.data.client_payments || [];
                            this.portalUrl = json.data.portal_url || window.location.href;
                            this.waMessage = json.data.wa_message || '';
                            this.waEncoded = json.data.wa_encoded || '';
                            this.emailSubjectRaw = json.data.email_subject || '';
                            this.emailBodyRaw = json.data.email_body || '';
                            this.targetPhone = this.project.client_phone || '';
                            this.targetEmail = this.project.client_email || '';
                        } else {
                            this.showToast(json.message || 'Gagal memuat proyek.', true);
                        }
                    } catch (e) {
                        this.showToast('Gagal terhubung ke portal klien.', true);
                    } finally {
                        this.loading = false;
                    }
                },

                switchProject(id, token) {
                    const newUrl = token ? 'client.php?token=' + encodeURIComponent(token) : 'client.php?id=' + encodeURIComponent(id);
                    window.history.pushState({}, '', newUrl);
                    this.loadData(id, token);
                },

                totalTermsAmount() {
                    return this.paymentTerms.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
                },

                formatRupiah(num) {
                    return 'Rp ' + (parseFloat(num) || 0).toLocaleString('id-ID');
                },

                formatDate(dateStr) {
                    if (!dateStr) return '-';
                    const parts = dateStr.split('-');
                    if (parts.length === 3) {
                        return `${parts[2]}/${parts[1]}/${parts[0]}`;
                    }
                    return dateStr;
                },

                getWorkflowLabel(step) {
                    switch (step) {
                        case 'KONTRAK_DP': return 'Kontrak & DP Awal';
                        case 'PENGERJAAN': return 'Pengerjaan Desain';
                        case 'REVISI': return 'Tahap Revisi';
                        case 'PEMBAYARAN_AKHIR': return 'Pembayaran Akhir';
                        case 'DONE': return 'Proyek Selesai';
                        default: return step || 'Aktif';
                    }
                },

                isStepCurrent(stepNum) {
                    const step = this.project ? this.project.workflow_step : '';
                    if (stepNum === 1) return step === 'KONTRAK_DP';
                    if (stepNum === 2) return step === 'PENGERJAAN';
                    if (stepNum === 3) return step === 'REVISI';
                    if (stepNum === 4) return step === 'PEMBAYARAN_AKHIR';
                    if (stepNum === 5) return step === 'DONE';
                    return false;
                },

                isStepCompleted(stepNum) {
                    const step = this.project ? this.project.workflow_step : '';
                    const order = ['KONTRAK_DP', 'PENGERJAAN', 'REVISI', 'PEMBAYARAN_AKHIR', 'DONE'];
                    const currentIdx = order.indexOf(step);
                    return currentIdx > (stepNum - 1);
                },

                isStepActiveOrDone(stepNum) {
                    return this.isStepCurrent(stepNum) || this.isStepCompleted(stepNum);
                },

                async submitClientRevision() {
                    if (!this.formRev.title || !this.formRev.description) {
                        this.showToast('Judul dan catatan revisi wajib diisi.', true);
                        return;
                    }
                    try {
                        const res = await fetch('api.php?action=add_revision', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                project_id: this.project.project_id,
                                title: this.formRev.title,
                                description: this.formRev.description,
                                requested_by: this.project.client_name || 'Client'
                            })
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.modals.newRevision = false;
                            this.formRev = { title: '', description: '' };
                            this.showToast('Catatan revisi berhasil diajukan!');
                            this.loadData(this.project.project_id);
                        } else {
                            this.showToast(json.message, true);
                        }
                    } catch (e) {
                        this.showToast('Gagal mengajukan revisi.', true);
                    }
                },

                async approveRevisionDeal() {
                    if (!confirm('Apakah Anda yakin menyetujui seluruh hasil revisi dan DEAL dengan hasil pekerjaan ini? Proyek akan dilanjutkan ke tahap Pembayaran Akhir.')) {
                        return;
                    }
                    try {
                        const res = await fetch('api.php?action=approve_revision_deal', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ project_id: this.project.project_id })
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.showToast('Revisi berhasil disetujui (DEAL)! Melangkah ke Pembayaran Akhir.');
                            this.loadData(this.project.project_id);
                        } else {
                            this.showToast(json.message, true);
                        }
                    } catch (e) {
                        this.showToast('Gagal memproses approval deal.', true);
                    }
                },

                openWaModal() {
                    this.targetPhone = this.project ? (this.project.client_phone || '') : '';
                    this.modals.wa = true;
                },

                sendWhatsAppDirect() {
                    let phone = this.targetPhone.replace(/[^0-9]/g, '');
                    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
                    const url = `https://wa.me/${phone}?text=${this.waEncoded}`;
                    window.open(url, '_blank');
                    this.modals.wa = false;
                },

                copyPortalUrl() {
                    navigator.clipboard.writeText(this.portalUrl).then(() => {
                        this.showToast('Tautan portal klien berhasil disalin ke clipboard!');
                    }).catch(() => {
                        this.showToast('Gagal menyalin tautan.', true);
                    });
                }
            };
        }
    </script>
</body>
</html>
