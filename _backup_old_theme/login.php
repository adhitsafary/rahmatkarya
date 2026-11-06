<?php
// =====================================================================
// LOGIN PAGE: Rekapitulasi Cashflow (PRO VAULT)
// =====================================================================

require_once __DIR__ . '/auth.php';

// If already logged in, redirect straight to dashboard
if (isLoggedIn()) {
    header("Location: index.php");
    exit;
}

$errorMessage = '';
$successMessage = '';
$redirectUrl = $_GET['redirect'] ?? 'index.php';

if (isset($_GET['logged_out'])) {
    $successMessage = 'Anda telah berhasil keluar dari sistem secara aman.';
}

// Handle standard POST submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $identifier = $_POST['identifier'] ?? '';
    $password = $_POST['password'] ?? '';
    $remember = !empty($_POST['remember']);

    $result = loginUser($identifier, $password, $remember);

    if ($result['success']) {
        // Safe redirect sanitization
        $target = filter_var($redirectUrl, FILTER_SANITIZE_URL);
        if (empty($target) || str_contains($target, 'login.php')) {
            $target = ($result['user']['role'] === 'CLIENT') ? 'client.php' : 'index.php';
        }
        header("Location: " . $target);
        exit;
    } else {
        $errorMessage = $result['message'];
    }
}
?>
<!DOCTYPE html>
<html lang="id" x-data="loginPage()" :class="{ 'dark': isDarkMode }">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Masuk - Rekapitulasi Cashflow</title>
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
                            rose: '#E11D48'
                        }
                    },
                    boxShadow: {
                        'fintech': '0 4px 24px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
                        'hero': '0 20px 40px -15px rgba(37, 99, 235, 0.20)',
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
    </style>
</head>
<body class="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen flex flex-col justify-between transition-colors antialiased relative overflow-x-hidden selection:bg-blue-600 selection:text-white">

    <!-- Ambient Subtle Glows -->
    <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute top-1/2 -right-32 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Top Minimal Bar -->
    <header class="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between relative z-10">
        <!-- Brand Link -->
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-md shadow-blue-500/25 flex items-center justify-center text-white font-black text-sm tracking-tight">
                RC
            </div>
            <div>
                <div class="flex items-center gap-2">
                    <span class="text-sm font-black tracking-tight text-slate-900 dark:text-white">Rekapitulasi Cashflow</span>
                    <span class="inline-flex items-center gap-1.5 text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        LIVE KAS
                    </span>
                </div>
                <p class="text-[11px] font-medium text-slate-400">Freelance Financial Control & Piutang</p>
            </div>
        </div>

        <!-- Light/Dark Mode Switcher -->
        <button @click="isDarkMode = !isDarkMode" 
                class="px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-xs font-semibold shadow-2xs"
                :title="isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'">
            <span class="w-1.5 h-1.5 rounded-full" :class="isDarkMode ? 'bg-amber-400' : 'bg-slate-400'"></span>
            <span x-text="isDarkMode ? 'Dark' : 'Light'"></span>
        </button>
    </header>

    <!-- Main Content: Login Form Card -->
    <main class="w-full max-w-md mx-auto px-4 py-8 relative z-10 my-auto">
        
        <div class="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 backdrop-blur-xl p-6 sm:p-8 shadow-hero transition">
            
            <!-- Card Header -->
            <div class="text-center mb-6">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold uppercase tracking-widest mb-3">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    Sistem Autentikasi
                </div>
                <h2 class="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">Selamat Datang</h2>
                <p class="text-xs font-medium text-slate-400 mt-1">Masukkan kredensial akun untuk mengakses buku kas & monitoring proyek</p>
            </div>

            <!-- Flash Error Message -->
            <?php if (!empty($errorMessage)): ?>
                <div class="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
                    <span class="px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900/60 text-[10px] uppercase font-black tracking-wider text-rose-800 dark:text-rose-200">Gagal</span>
                    <span class="flex-1"><?= htmlspecialchars($errorMessage) ?></span>
                </div>
            <?php endif; ?>

            <!-- Flash Success Message -->
            <?php if (!empty($successMessage)): ?>
                <div class="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5">
                    <span class="px-1.5 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900/60 text-[10px] uppercase font-black tracking-wider text-emerald-800 dark:text-emerald-200">Sukses</span>
                    <span class="flex-1"><?= htmlspecialchars($successMessage) ?></span>
                </div>
            <?php endif; ?>

            <!-- Login Form -->
            <form method="POST" action="login.php?redirect=<?= urlencode($redirectUrl) ?>" class="space-y-4">
                
                <!-- Field: Identifier (Username or Email) -->
                <div>
                    <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        Username atau Email
                    </label>
                    <div class="relative">
                        <input type="text" 
                               name="identifier" 
                               x-model="identifier"
                               required 
                               placeholder="admin atau admin@procash.local"
                               autocomplete="username"
                               class="w-full text-xs font-medium rounded-xl px-3.5 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white placeholder-slate-400 transition font-mono">
                    </div>
                </div>

                <!-- Field: Password -->
                <div>
                    <div class="flex items-center justify-between mb-1.5">
                        <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Kata Sandi
                        </label>
                        <span class="text-[11px] text-slate-400">Aman & Terenkripsi</span>
                    </div>
                    <div class="relative">
                        <input :type="showPassword ? 'text' : 'password'" 
                               name="password" 
                               x-model="password"
                               required 
                               placeholder="••••••••"
                               autocomplete="current-password"
                               class="w-full text-xs font-medium rounded-xl pl-3.5 pr-16 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-slate-900 dark:text-white placeholder-slate-400 transition font-mono">
                        <button type="button" 
                                @click="showPassword = !showPassword"
                                class="absolute right-3 top-3 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-wider transition">
                            <span x-text="showPassword ? 'Sembunyi' : 'Lihat'"></span>
                        </button>
                    </div>
                </div>

                <!-- Remember Me & Status Row -->
                <div class="flex items-center justify-between pt-1">
                    <label class="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" 
                               name="remember" 
                               class="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-slate-50 dark:bg-slate-900">
                        <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">Ingat saya di perangkat ini</span>
                    </label>
                </div>

                <!-- Submit Button -->
                <button type="submit" 
                        class="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white shadow-sm transition flex items-center justify-center gap-2">
                    <span>Masuk ke Dashboard</span>
                </button>
            </form>

            <!-- Quick Demo Credentials Box -->
            <div class="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <div class="flex items-center justify-between mb-2.5">
                    <span class="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">
                        Akses Cepat Akun Demo:
                    </span>
                    <span class="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Klik untuk Isi Otomatis</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button type="button" 
                            @click="fillCredentials('admin', 'admin123')"
                            class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-blue-300 dark:hover:border-blue-700 text-left transition group">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">ADMIN</span>
                        </div>
                        <div class="text-[10px] text-slate-400 font-mono mt-1.5">admin / admin123</div>
                    </button>
                    <button type="button" 
                            @click="fillCredentials('finance', 'password123')"
                            class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-amber-300 dark:hover:border-amber-700 text-left transition group">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">FINANCE</span>
                        </div>
                        <div class="text-[10px] text-slate-400 font-mono mt-1.5">finance / password123</div>
                    </button>
                    <button type="button" 
                            @click="fillCredentials('client', 'client123')"
                            class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:border-emerald-300 dark:hover:border-emerald-700 text-left transition group">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">CLIENT</span>
                        </div>
                        <div class="text-[10px] text-slate-400 font-mono mt-1.5">client / client123</div>
                    </button>
                </div>
            </div>

        </div>

        <!-- Security & Version Info Footer -->
        <div class="text-center mt-6 text-[11px] text-slate-400 font-medium">
            <p>Sistem Manajemen Keuangan Mandiri &bull; Dilindungi Enkripsi Sesi</p>
            <p class="mt-1 text-[10px] font-mono text-slate-400/80">ProCash Tracker v2.0 - Bank-Grade Financial Ledger</p>
        </div>

    </main>

    <!-- Footer Space Holder -->
    <div class="py-4"></div>

    <!-- Page Logic Script -->
    <script>
        function loginPage() {
            return {
                isDarkMode: false,
                showPassword: false,
                identifier: 'admin',
                password: '',

                init() {
                    const savedDark = localStorage.getItem('procash_dark');
                    if (savedDark !== null) {
                        this.isDarkMode = (savedDark === 'true');
                    }
                    this.$watch('isDarkMode', val => {
                        localStorage.setItem('procash_dark', val);
                    });
                },

                fillCredentials(user, pass) {
                    this.identifier = user;
                    this.password = pass;
                }
            }
        }
    </script>
</body>
</html>
