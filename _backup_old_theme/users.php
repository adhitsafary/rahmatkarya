<?php
// =====================================================================
// USER MANAGEMENT PAGE: Rekapitulasi Cashflow (PRO VAULT)
// =====================================================================

require_once __DIR__ . '/auth.php';

// Only Administrator can access this page
requireAdmin();

$currentUser = getCurrentUser();
?>
<!DOCTYPE html>
<html lang="id" x-data="userMgmtApp()" :class="{ 'dark': isDarkMode }" x-init="initApp()">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Manajemen Pengguna - Rekapitulasi Cashflow</title>
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
        .smooth-scroll {
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
        }
    </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen transition-colors antialiased selection:bg-blue-600 selection:text-white">

    <!-- Toast Notification -->
    <div x-cloak 
         x-show="toast.show" 
         x-transition:enter="transition ease-out duration-300"
         x-transition:enter-start="opacity-0 transform translate-y-4 scale-95"
         x-transition:enter-end="opacity-100 transform translate-y-0 scale-100"
         x-transition:leave="transition ease-in duration-200"
         x-transition:leave-start="opacity-100 transform translate-y-0 scale-100"
         x-transition:leave-end="opacity-0 transform translate-y-4 scale-95"
         class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl text-xs sm:text-sm font-bold border backdrop-blur-md"
         :class="toast.isError ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30' : 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/30 dark:bg-white dark:text-slate-900'">
        <span x-text="toast.isError ? 'ERR' : 'OK'" class="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider" :class="toast.isError ? 'bg-white/20' : 'bg-blue-500 text-white'"></span>
        <span x-text="toast.message"></span>
    </div>

    <!-- Top App Bar -->
    <header class="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            
            <!-- App Brand & Title -->
            <div class="flex items-center gap-3">
                <a href="index.php" class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/25 flex items-center justify-center text-white font-black text-sm tracking-tight hover:opacity-90 transition">
                    RC
                </a>
                <div>
                    <div class="flex items-center gap-2">
                        <span class="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white">Rekapitulasi Cashflow</span>
                        <span class="inline-flex items-center gap-1.5 text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            LIVE KAS
                        </span>
                    </div>
                    <p class="text-[11px] font-medium text-slate-400">Portal Pengaturan & Manajemen Pengguna</p>
                </div>
            </div>

            <!-- Top Right Nav & Controls -->
            <div class="flex items-center gap-2 sm:gap-3">
                
                <!-- Back to Financial Dashboard -->
                <a href="index.php" 
                   class="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition">
                    <span>←</span>
                    <span class="hidden sm:inline">Dashboard Keuangan</span>
                </a>

                <!-- Dark/Light Mode Switcher -->
                <button @click="isDarkMode = !isDarkMode" 
                        class="px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-bold"
                        :title="isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'">
                    <span class="w-2 h-2 rounded-full" :class="isDarkMode ? 'bg-amber-400' : 'bg-slate-900'"></span>
                    <span x-text="isDarkMode ? 'Light' : 'Dark'"></span>
                </button>

                <!-- Current User Menu Dropdown -->
                <div class="relative flex items-center pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800" x-data="{ userMenuOpen: false }">
                    <button @click="userMenuOpen = !userMenuOpen" 
                            class="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition"
                            title="Profil Pengguna & Keluar">
                        <div class="w-8 h-8 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center font-black text-xs">
                            <?= htmlspecialchars(substr($currentUser['name'] ?? 'U', 0, 1)) ?>
                        </div>
                        <div class="hidden md:block text-left text-xs leading-tight">
                            <div class="font-extrabold text-slate-900 dark:text-white truncate max-w-[110px]"><?= htmlspecialchars($currentUser['name'] ?? 'User') ?></div>
                            <div class="text-[10px] text-slate-400 font-mono"><?= htmlspecialchars($currentUser['role'] ?? 'ADMIN') ?></div>
                        </div>
                        <span class="text-slate-400 text-[10px] hidden sm:inline">▾</span>
                    </button>

                    <!-- Dropdown Menu -->
                    <div x-show="userMenuOpen" 
                         @click.away="userMenuOpen = false" 
                         x-transition
                         class="absolute right-0 top-11 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-fintech-hover border border-slate-200/90 dark:border-slate-800 p-2 z-50 text-xs">
                        
                        <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                            <p class="font-bold text-slate-900 dark:text-white truncate"><?= htmlspecialchars($currentUser['name'] ?? 'User') ?></p>
                            <p class="text-[10px] text-slate-400 font-mono truncate"><?= htmlspecialchars($currentUser['email'] ?? '') ?></p>
                            <span class="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                                <?= htmlspecialchars($currentUser['role'] ?? 'ADMIN') ?>
                            </span>
                        </div>

                        <a href="index.php" 
                           class="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition">
                            <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span>Dashboard Keuangan</span>
                        </a>

                        <a href="logout.php" 
                           class="flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold transition">
                            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>Keluar Sistem</span>
                        </a>
                    </div>
                </div>

            </div>
        </div>
    </header>

    <!-- Main Content Container -->
    <main class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">

        <!-- Header Title & Action Bar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <div class="flex items-center gap-2.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">USERS</span>
                    <h1 class="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                        Manajemen Pengguna & Hak Akses
                    </h1>
                </div>
                <p class="text-xs font-medium text-slate-400 mt-1">
                    Kelola akun pengguna, hak akses level peran (Role), serta kredensial kata sandi
                </p>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center gap-2 self-start sm:self-auto">
                <button @click="modals.roleInfo = true" 
                        type="button"
                        class="inline-flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300/50 dark:border-amber-700/50 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl transition cursor-pointer"
                        title="Panduan Perbandingan Hak Akses Role">
                    <span class="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-[10px]">!</span>
                    <span>Panduan Role</span>
                </button>
                <button @click="openCreateModal()" 
                        class="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-md shadow-blue-600/25 transition cursor-pointer">
                    <span class="text-base font-bold">+</span>
                    <span>Tambah Pengguna Baru</span>
                </button>
            </div>
        </div>

        <!-- Metric Stat Cards (Role Breakdown) -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <!-- Stat 1: Total Users -->
            <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-fintech">
                <span class="text-[10px] uppercase font-black tracking-wider text-slate-400">Total Pengguna</span>
                <div class="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono" x-text="users.length">0</div>
                <span class="text-[10px] font-bold text-slate-400">Akun terdaftar</span>
            </div>

            <!-- Stat 2: Admin -->
            <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-fintech">
                <span class="text-[10px] uppercase font-black tracking-wider text-blue-600 dark:text-blue-400">Administrator</span>
                <div class="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono" 
                     x-text="users.filter(u => u.role === 'ADMIN').length">0</div>
                <span class="text-[10px] font-bold text-slate-400">Akses penuh</span>
            </div>

            <!-- Stat 3: Finance -->
            <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-fintech">
                <span class="text-[10px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400">Tim Finance</span>
                <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono" 
                     x-text="users.filter(u => u.role === 'FINANCE').length">0</div>
                <span class="text-[10px] font-bold text-slate-400">Kelola arus kas</span>
            </div>

            <!-- Stat 4: Viewer -->
            <div class="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-fintech">
                <span class="text-[10px] uppercase font-black tracking-wider text-slate-500">Viewer / Klien</span>
                <div class="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1 font-mono" 
                     x-text="users.filter(u => u.role === 'VIEWER').length">0</div>
                <span class="text-[10px] font-bold text-slate-400">Lihat rekapitulasi</span>
            </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-fintech">
            <!-- Search Input -->
            <div class="relative w-full sm:w-72">
                <svg class="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input type="text" 
                       x-model="searchQuery" 
                       placeholder="Cari nama, username, email..." 
                       class="w-full text-xs font-semibold rounded-xl pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition">
            </div>

            <!-- Role Filter Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button @click="roleFilter = 'ALL'" 
                        :class="roleFilter === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'"
                        class="px-3 py-1.5 rounded-xl text-xs font-bold transition">
                    Semua Role
                </button>
                <button @click="roleFilter = 'ADMIN'" 
                        :class="roleFilter === 'ADMIN' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'"
                        class="px-3 py-1.5 rounded-xl text-xs font-bold transition">
                    Admin
                </button>
                <button @click="roleFilter = 'FINANCE'" 
                        :class="roleFilter === 'FINANCE' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'"
                        class="px-3 py-1.5 rounded-xl text-xs font-bold transition">
                    Finance
                </button>
                <button @click="roleFilter = 'VIEWER'" 
                        :class="roleFilter === 'VIEWER' ? 'bg-slate-700 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'"
                        class="px-3 py-1.5 rounded-xl text-xs font-bold transition">
                    Viewer
                </button>
            </div>
        </div>

        <!-- Users Data Table -->
        <div class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-fintech overflow-hidden transition">
            
            <div class="overflow-x-auto smooth-scroll">
                <table class="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr class="border-b uppercase font-extrabold tracking-wider bg-slate-50/80 text-slate-500 border-slate-200/80 dark:bg-slate-950/80 dark:text-slate-400 dark:border-slate-800 text-[11px]">
                            <th class="py-4 px-5">Nama & Profil</th>
                            <th class="py-4 px-4">Username & Email</th>
                            <th class="py-4 px-4 text-center">Hak Akses (Role)</th>
                            <th class="py-4 px-4">Terakhir Masuk</th>
                            <th class="py-4 px-4">Dibuat Pada</th>
                            <th class="py-4 px-5 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                        
                        <template x-for="(user, index) in filteredUsers" :key="user.id">
                            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                                
                                <!-- 1. User Name & Monogram Avatar -->
                                <td class="py-3.5 px-5">
                                    <div class="flex items-center gap-3">
                                        <div class="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs font-mono"
                                             :class="getAvatarClass(index)" 
                                             x-text="getInitials(user.name)"></div>
                                        <div>
                                            <div class="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                                <span x-text="user.name"></span>
                                                <template x-if="user.id === currentUserId">
                                                    <span class="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                                        Anda
                                                    </span>
                                                </template>
                                            </div>
                                            <span class="text-[10px] text-slate-400 font-mono" x-text="`ID: #${user.id}`"></span>
                                        </div>
                                    </div>
                                </td>

                                <!-- 2. Username & Email -->
                                <td class="py-3.5 px-4 font-mono">
                                    <div class="font-bold text-slate-800 dark:text-slate-200 text-xs" x-text="`@${user.username}`"></div>
                                    <div class="text-[11px] text-slate-400" x-text="user.email"></div>
                                </td>

                                <!-- 3. Role Badge -->
                                <td class="py-3.5 px-4 text-center">
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wide"
                                          :class="{
                                              'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800': user.role === 'ADMIN',
                                              'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800': user.role === 'FINANCE',
                                              'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700': user.role === 'VIEWER'
                                          }">
                                        <span class="w-1.5 h-1.5 rounded-full" :class="user.role === 'ADMIN' ? 'bg-blue-600' : (user.role === 'FINANCE' ? 'bg-emerald-600' : 'bg-slate-500')"></span>
                                        <span x-text="user.role"></span>
                                    </span>
                                </td>

                                <!-- 4. Last Login -->
                                <td class="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                    <span x-text="user.last_login ? formatDateTime(user.last_login) : 'Belum pernah login'"></span>
                                </td>

                                <!-- 5. Created Date -->
                                <td class="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                                    <span x-text="formatDateOnly(user.created_at)"></span>
                                </td>

                                <!-- 6. Actions (Edit / Delete) -->
                                <td class="py-3.5 px-5 text-right">
                                    <div class="flex items-center justify-end gap-1.5">
                                        <!-- Edit Button -->
                                        <button @click="openEditModal(user)" 
                                                class="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition">
                                            Edit
                                        </button>

                                        <!-- Delete Button (Safeguarded against self) -->
                                        <template x-if="user.id !== currentUserId">
                                            <button @click="deleteUser(user)" 
                                                    class="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold text-rose-600 dark:text-rose-400 transition">
                                                Hapus
                                            </button>
                                        </template>
                                    </div>
                                </td>

                            </tr>
                        </template>

                        <!-- Empty State -->
                        <template x-if="filteredUsers.length === 0">
                            <tr>
                                <td colspan="6" class="py-12 text-center text-slate-400">
                                    <div class="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400 font-bold text-xs">0</div>
                                    <div class="text-sm font-bold text-slate-700 dark:text-slate-300">Tidak ada data pengguna ditemukan</div>
                                    <p class="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter role.</p>
                                </td>
                            </tr>
                        </template>

                    </tbody>
                </table>
            </div>

        </div>

    </main>

    <!-- ================================================================= -->
    <!-- MODAL 1: TAMBAH PENGGUNA BARU                                     -->
    <!-- ================================================================= -->
    <div x-cloak 
         x-show="modals.create" 
         class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        
        <div @click.away="modals.create = false" 
             x-transition
             class="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-hero p-6 sm:p-8 space-y-5">
            
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-2.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">NEW</span>
                    <div>
                        <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">Tambah Pengguna Baru</h3>
                        <p class="text-xs text-slate-400">Buat akun untuk staf atau rekan tim Anda</p>
                    </div>
                </div>
                <button @click="modals.create = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base">&times;</button>
            </div>

            <form @submit.prevent="submitCreateUser()" class="space-y-4 text-xs font-medium">
                <div>
                    <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                    <input type="text" x-model="formCreate.name" required placeholder="misal: Siti Nurhaliza"
                           class="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-sans">
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Username Login</label>
                        <input type="text" x-model="formCreate.username" required placeholder="misal: sitifinance"
                               class="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-mono">
                    </div>
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <div class="flex items-center gap-1.5">
                                <label class="font-bold text-slate-700 dark:text-slate-300">Level Hak Akses (Role)</label>
                                <button type="button" @click="modals.roleInfo = true" 
                                        class="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-black text-[10px] flex items-center justify-center transition cursor-pointer" 
                                        title="Klik untuk melihat penjelasan fitur/aksi setiap role">
                                    ?
                                </button>
                            </div>
                            <button type="button" @click="modals.roleInfo = true" 
                                    class="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-bold hover:underline cursor-pointer">
                                Panduan Fitur
                            </button>
                        </div>
                        <select x-model="formCreate.role" 
                                class="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-bold cursor-pointer">
                            <option value="ADMIN">ADMIN (Akses Penuh)</option>
                            <option value="FINANCE">FINANCE (Arus Kas)</option>
                            <option value="VIEWER">VIEWER (Hanya Lihat)</option>
                        </select>
                        <div class="mt-1 text-[10px] font-semibold">
                            <span x-show="formCreate.role === 'ADMIN'" class="text-blue-600 dark:text-blue-400">Akses Penuh: Kelola Proyek, Kas & Pengguna</span>
                            <span x-show="formCreate.role === 'FINANCE'" class="text-emerald-600 dark:text-emerald-400">Kelola Kas & Proyek (Akses Pengguna Ditolak)</span>
                            <span x-show="formCreate.role === 'VIEWER'" class="text-slate-500 dark:text-slate-400">Tamu: Hanya melihat saldo & unduh laporan PDF</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Alamat Email</label>
                    <input type="email" x-model="formCreate.email" required placeholder="siti@example.com"
                           class="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-mono">
                </div>

                <div>
                    <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kata Sandi (Password)</label>
                    <input type="password" x-model="formCreate.password" required placeholder="Minimal 6 karakter"
                           class="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-mono">
                </div>

                <div class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" @click="modals.create = false" 
                            class="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition">
                        Batal
                    </button>
                    <button type="submit" 
                            class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30 transition">
                        Simpan Pengguna
                    </button>
                </div>
            </form>

        </div>
    </div>

    <!-- ================================================================= -->
    <!-- MODAL 2: EDIT PENGGUNA                                            -->
    <!-- ================================================================= -->
    <div x-cloak 
         x-show="modals.edit" 
         class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        
        <div @click.away="modals.edit = false" 
             x-transition
             class="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-hero p-6 sm:p-8 space-y-5">
            
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-2.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">EDIT</span>
                    <div>
                        <h3 class="text-base sm:text-lg font-black text-slate-900 dark:text-white">Edit Data Pengguna</h3>
                        <p class="text-xs text-slate-400" x-text="`ID Pengguna: #${formEdit.id}`"></p>
                    </div>
                </div>
                <button @click="modals.edit = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base">&times;</button>
            </div>

            <form @submit.prevent="submitEditUser()" class="space-y-4 text-xs font-medium">
                <div>
                    <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                    <input type="text" x-model="formEdit.name" required
                           class="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-sans">
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Username Login</label>
                        <input type="text" x-model="formEdit.username" required
                               class="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-mono">
                    </div>
                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <div class="flex items-center gap-1.5">
                                <label class="font-bold text-slate-700 dark:text-slate-300">Level Hak Akses (Role)</label>
                                <button type="button" @click="modals.roleInfo = true" 
                                        class="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-black text-[10px] flex items-center justify-center transition cursor-pointer" 
                                        title="Klik untuk melihat penjelasan fitur/aksi setiap role">
                                    ?
                                </button>
                            </div>
                            <button type="button" @click="modals.roleInfo = true" 
                                    class="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-bold hover:underline cursor-pointer">
                                Panduan Fitur
                            </button>
                        </div>
                        <select x-model="formEdit.role" 
                                class="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-bold cursor-pointer">
                            <option value="ADMIN">ADMIN (Akses Penuh)</option>
                            <option value="FINANCE">FINANCE (Arus Kas)</option>
                            <option value="VIEWER">VIEWER (Hanya Lihat)</option>
                        </select>
                        <div class="mt-1 text-[10px] font-semibold">
                            <span x-show="formEdit.role === 'ADMIN'" class="text-blue-600 dark:text-blue-400">Akses Penuh: Kelola Proyek, Kas & Pengguna</span>
                            <span x-show="formEdit.role === 'FINANCE'" class="text-emerald-600 dark:text-emerald-400">Kelola Kas & Proyek (Akses Pengguna Ditolak)</span>
                            <span x-show="formEdit.role === 'VIEWER'" class="text-slate-500 dark:text-slate-400">Tamu: Hanya melihat saldo & unduh laporan PDF</span>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block font-bold text-slate-700 dark:text-slate-300 mb-1">Alamat Email</label>
                    <input type="email" x-model="formEdit.email" required
                           class="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-mono">
                </div>

                <div>
                    <div class="flex items-center justify-between mb-1">
                        <label class="block font-bold text-slate-700 dark:text-slate-300">Ganti Kata Sandi (Opsional)</label>
                        <span class="text-[10px] text-slate-400">Kosongkan jika tidak ingin mengubah sandi</span>
                    </div>
                    <input type="password" x-model="formEdit.password" placeholder="Ketik kata sandi baru (minimal 6 karakter)"
                           class="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-mono">
                </div>

                <div class="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" @click="modals.edit = false" 
                            class="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition">
                        Batal
                    </button>
                    <button type="submit" 
                            class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/30 transition">
                        Perbarui Pengguna
                    </button>
                </div>
            </form>

        </div>
    </div>

    <!-- ================================================================= -->
    <!-- MODAL 3: PANDUAN FITUR & HAK AKSES ROLE (MATRIX)                 -->
    <!-- ================================================================= -->
    <div x-cloak 
         x-show="modals.roleInfo" 
         class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        
        <div @click.away="modals.roleInfo = false" 
             x-transition
             class="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-hero p-6 sm:p-7 space-y-4">
            
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-2.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">ROLES</span>
                    <div>
                        <h3 class="text-base font-black text-slate-900 dark:text-white">Panduan Fitur & Hak Akses Role</h3>
                        <p class="text-xs text-slate-400">Rincian perbandingan hak akses antara Admin, Finance, dan Viewer</p>
                    </div>
                </div>
                <button @click="modals.roleInfo = false" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base">&times;</button>
            </div>

            <!-- Table Matrix -->
            <div class="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800">
                            <th class="py-3 px-4">Fitur / Aksi</th>
                            <th class="py-3 px-3 text-center text-blue-600 dark:text-blue-400 font-bold">Admin</th>
                            <th class="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">Finance</th>
                            <th class="py-3 px-3 text-center text-slate-600 dark:text-slate-300 font-bold">Viewer (Tamu)</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                        <tr><td class="py-2.5 px-4 font-semibold">Melihat Saldo Kas & Dashboard</td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td></tr>
                        <tr><td class="py-2.5 px-4 font-semibold">Menambah Proyek Baru</td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold">Tidak</span></td></tr>
                        <tr><td class="py-2.5 px-4 font-semibold">Catat Pembayaran Klien ( + Bayar )</td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold">Tidak</span></td></tr>
                        <tr><td class="py-2.5 px-4 font-semibold">Tambah Anggota Tim & Alokasi Plafon</td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold">Tidak</span></td></tr>
                        <tr><td class="py-2.5 px-4 font-semibold">Bayar / Cairkan Honor Tim ( + Honor )</td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold">Tidak</span></td></tr>
                        <tr><td class="py-2.5 px-4 font-semibold">Kirim Reminder WhatsApp Penagihan</td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold">Tidak</span></td></tr>
                        <tr><td class="py-2.5 px-4 font-semibold">Cetak Rekap Laporan PDF</td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td></tr>
                        <tr><td class="py-2.5 px-4 font-semibold">Akses Menu "Manajemen Pengguna"</td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold">Ditolak</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold">Ditolak</span></td></tr>
                        <tr><td class="py-2.5 px-4 font-semibold">Tambah Akun User Baru</td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold">Ditolak</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold">Ditolak</span></td></tr>
                        <tr><td class="py-2.5 px-4 font-semibold">Hapus Akun / Ubah Role Staf</td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold">Ditolak</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold">Ditolak</span></td></tr>
                        <tr><td class="py-2.5 px-4 font-semibold">Reset Password Pengguna Lain</td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Ya</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold">Ditolak</span></td><td class="py-2.5 px-3 text-center"><span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 font-bold">Ditolak</span></td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Role Notes Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <div class="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[11px]">
                    <strong class="text-blue-700 dark:text-blue-300 block mb-1">ADMIN</strong>
                    <p class="text-slate-600 dark:text-slate-400 leading-snug">Untuk pemilik usaha. Akses 100% penuh termasuk manajemen user.</p>
                </div>
                <div class="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-[11px]">
                    <strong class="text-emerald-700 dark:text-emerald-300 block mb-1">FINANCE</strong>
                    <p class="text-slate-600 dark:text-slate-400 leading-snug">Untuk staf akunting / bendahara. Mengelola kas proyek tanpa akses user.</p>
                </div>
                <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px]">
                    <strong class="text-slate-700 dark:text-slate-300 block mb-1">VIEWER</strong>
                    <p class="text-slate-600 dark:text-slate-400 leading-snug">Untuk tamu pengawas. Hanya melihat saldo & unduh laporan PDF.</p>
                </div>
            </div>

            <div class="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" @click="modals.roleInfo = false" 
                        class="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition cursor-pointer">
                    Saya Mengerti
                </button>
            </div>
        </div>
    </div>

    <!-- Application Javascript Logic -->
    <script>
        function userMgmtApp() {
            return {
                isDarkMode: false,
                currentUserId: <?= (int)($currentUser['id'] ?? 0) ?>,
                users: [],
                searchQuery: '',
                roleFilter: 'ALL',

                modals: {
                    create: false,
                    edit: false,
                    roleInfo: false
                },

                formCreate: {
                    name: '',
                    username: '',
                    email: '',
                    role: 'FINANCE',
                    password: ''
                },

                formEdit: {
                    id: 0,
                    name: '',
                    username: '',
                    email: '',
                    role: 'VIEWER',
                    password: ''
                },

                toast: {
                    show: false,
                    message: '',
                    isError: false,
                    timeout: null
                },

                avatarPalettes: [
                    'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
                    'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
                    'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
                    'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
                    'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                ],

                initApp() {
                    const savedDark = localStorage.getItem('procash_dark');
                    if (savedDark !== null) {
                        this.isDarkMode = (savedDark === 'true');
                    }
                    this.$watch('isDarkMode', val => {
                        localStorage.setItem('procash_dark', val);
                    });

                    this.fetchUsers();
                },

                get filteredUsers() {
                    return this.users.filter(u => {
                        const matchRole = (this.roleFilter === 'ALL' || u.role === this.roleFilter);
                        const q = this.searchQuery.toLowerCase().trim();
                        const matchQuery = !q || 
                            u.name.toLowerCase().includes(q) || 
                            u.username.toLowerCase().includes(q) || 
                            u.email.toLowerCase().includes(q);
                        return matchRole && matchQuery;
                    });
                },

                async fetchUsers() {
                    try {
                        const res = await fetch('api.php?action=get_users');
                        if (res.status === 401) {
                            window.location.href = 'login.php';
                            return;
                        }
                        const json = await res.json();
                        if (json.success) {
                            this.users = json.data;
                        } else {
                            this.showToast(json.message || 'Gagal memuat pengguna', true);
                        }
                    } catch (e) {
                        this.showToast('Gagal terhubung ke server', true);
                    }
                },

                openCreateModal() {
                    this.formCreate = {
                        name: '',
                        username: '',
                        email: '',
                        role: 'FINANCE',
                        password: ''
                    };
                    this.modals.create = true;
                },

                async submitCreateUser() {
                    try {
                        const res = await fetch('api.php?action=create_user', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(this.formCreate)
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.showToast(json.message);
                            this.modals.create = false;
                            this.fetchUsers();
                        } else {
                            this.showToast(json.message || 'Gagal menambahkan pengguna', true);
                        }
                    } catch (e) {
                        this.showToast('Terjadi kesalahan jaringan', true);
                    }
                },

                openEditModal(user) {
                    this.formEdit = {
                        id: user.id,
                        name: user.name,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        password: ''
                    };
                    this.modals.edit = true;
                },

                async submitEditUser() {
                    try {
                        const res = await fetch('api.php?action=update_user', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(this.formEdit)
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.showToast(json.message);
                            this.modals.edit = false;
                            this.fetchUsers();
                        } else {
                            this.showToast(json.message || 'Gagal memperbarui pengguna', true);
                        }
                    } catch (e) {
                        this.showToast('Terjadi kesalahan jaringan', true);
                    }
                },

                async deleteUser(user) {
                    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna "${user.name}" (@${user.username})?`)) {
                        return;
                    }

                    try {
                        const res = await fetch('api.php?action=delete_user', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: user.id })
                        });
                        const json = await res.json();
                        if (json.success) {
                            this.showToast(json.message);
                            this.fetchUsers();
                        } else {
                            this.showToast(json.message || 'Gagal menghapus pengguna', true);
                        }
                    } catch (e) {
                        this.showToast('Terjadi kesalahan jaringan', true);
                    }
                },

                getAvatarClass(index) {
                    return this.avatarPalettes[index % this.avatarPalettes.length];
                },

                getInitials(name) {
                    if (!name) return 'US';
                    const parts = name.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        return (parts[0][0] + parts[1][0]).toUpperCase();
                    }
                    return name.substring(0, 2).toUpperCase();
                },

                formatDateOnly(dateStr) {
                    if (!dateStr) return '-';
                    const d = new Date(dateStr);
                    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                },

                formatDateTime(dateStr) {
                    if (!dateStr) return '-';
                    const d = new Date(dateStr);
                    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
                },

                showToast(message, isError = false) {
                    if (this.toast.timeout) clearTimeout(this.toast.timeout);
                    this.toast.message = message;
                    this.toast.isError = isError;
                    this.toast.show = true;
                    this.toast.timeout = setTimeout(() => {
                        this.toast.show = false;
                    }, 3500);
                }
            }
        }
    </script>
</body>
</html>
