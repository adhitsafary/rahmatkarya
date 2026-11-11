import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { apiLogin } from '../../services/api';

export default function FilamentLogin({ onLoginSuccess, isDarkMode, setIsDarkMode, showToast, appSettings }) {
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const companyName = appSettings?.company_name || 'Rahmat-Karya';
  const companyTagline = appSettings?.company_tagline || 'Sistem Manajemen Arus Kas';
  const companyLogo = appSettings?.company_logo || '';
  const companyMonogram = companyName
    .replace(/^PT\s+/i, '')
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'RK';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await apiLogin(identifier, password);
    if (res.success) {
      showToast('Berhasil masuk ke panel.');
      onLoginSuccess(res.user);
    } else {
      showToast(res.message || 'Username atau password salah', 'danger');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between p-4 sm:p-6 transition-colors selection:bg-slate-900 selection:text-white">
      
      {/* Top Bar with Clean Header & Theme Toggle */}
      <div className="max-w-md w-full mx-auto flex justify-between items-center py-2">
        <div className="flex items-center gap-2.5">
          {companyLogo ? (
            <div className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs overflow-hidden p-1">
              <img src={companyLogo} alt={companyName} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-mono font-black text-xs shadow-xs">
              {companyMonogram}
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              {companyName}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {companyTagline}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 sm:px-2.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center shrink-0"
          title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
          aria-label="Toggle Mode Gelap/Terang"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
          
          <div className="text-left space-y-1.5">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Otentikasi Keamanan
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight pt-1">
              Masuk ke Sistem Manajemen Kas
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sistem Manajemen Arus Kas & Monitoring Piutang Proyek
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                Username atau Email
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin atau email..."
                className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold"
                >
                  {showPassword ? 'Sembunyikan' : 'Tampilkan'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-xs shadow-xs transition cursor-pointer"
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Panel Operasional'}
            </button>
          </form>

        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          {companyName.toUpperCase().includes('PT') ? companyName : `PT ${companyName}`}
        </p>
      </div>

      <div className="py-2"></div>
    </div>
  );
}
