import React, { useState } from 'react';
import { Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { apiLogin } from '../../services/api';

export default function FilamentLogin({ onLoginSuccess, isDarkMode, setIsDarkMode, showToast, appSettings }) {
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const companyName = appSettings?.company_name || 'Rahmat-Karya';
  const companyLogo = appSettings?.company_logo || '';
  const companyMonogram = companyName
    .replace(/^PT\s+/i, '')
    .split(/[\s-]+/)
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'RK';

  const defaultBanner = 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80';
  const bannerImage = appSettings?.login_banner_image || defaultBanner;
  const bannerTitle = appSettings?.login_banner_title || `Selamat Datang di ${companyName}`;
  const bannerSubtitle = appSettings?.login_banner_subtitle || 'Mengintegrasikan Keamanan dan Efisiensi dalam Setiap Proyek Infrastruktur & Finansial.';

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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-slate-950 font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* ============================================================== */}
      {/* SISI KIRI: Banner Visual & Pesan Sambutan                       */}
      {/* ============================================================== */}
      <div className="w-full lg:w-1/2 bg-[#ecebf3] dark:bg-slate-900/70 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-14 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="w-full max-w-lg space-y-6 text-center">
          
          {/* Banner Image Card with Soft Shadow */}
          <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800 aspect-[16/10] group">
            <img
              src={bannerImage}
              alt={bannerTitle}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* Subtle bottom gradient glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Heading & Subtitle */}
          <div className="space-y-2 pt-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {bannerTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-md mx-auto text-center">
              {bannerSubtitle}
            </p>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* SISI KANAN: Formulir Login Terpusat                             */}
      {/* ============================================================== */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-14 min-h-[550px] lg:min-h-screen relative bg-white dark:bg-slate-950 transition-colors">
        
        {/* Dark Mode Toggle di Pojok Kanan Atas */}
        <div className="absolute top-5 right-5 sm:top-6 sm:right-6">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-center shadow-2xs"
            title={isDarkMode ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            aria-label="Toggle Mode Gelap/Terang"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
          </button>
        </div>

        {/* Floating Login Card */}
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-7 sm:p-9 shadow-xl border border-slate-200/90 dark:border-slate-800 space-y-6">
          
          {/* Logo Badge & Title */}
          <div className="text-center space-y-3">
            {companyLogo ? (
              <div className="w-16 h-14 mx-auto rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center p-2 shadow-xs overflow-hidden">
                <img src={companyLogo} alt={companyName} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black font-mono text-xl shadow-md shadow-indigo-600/30">
                {companyMonogram}
              </div>
            )}

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {companyName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                Silakan login untuk melanjutkan
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Masukkan username atau email"
                className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 sm:py-3 pr-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl sm:rounded-2xl bg-[#6347f8] hover:bg-[#5235eb] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Memverifikasi...' : 'Login'}
            </button>
          </form>

          {/* Footer Copyright */}
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2 font-medium">
            &copy; {new Date().getFullYear()} {companyName}
          </p>

        </div>

      </div>

    </div>
  );
}
