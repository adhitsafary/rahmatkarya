import React from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[360px] p-8 flex flex-col items-center justify-center text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs m-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4 shadow-2xs">
            <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
          </div>
          
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Terjadi Kendala pada Tampilan Ini
          </h3>
          
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-5 leading-relaxed">
            Komponen ini mengalami error saat proses rendering. Anda dapat mencoba memuat ulang tampilan atau kembali ke tab utama.
          </p>

          {this.state.error?.message && (
            <div className="mb-5 max-w-lg w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-rose-600 dark:text-rose-400 overflow-x-auto">
              {this.state.error.message}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>

            {this.props.onGoHome && (
              <button
                onClick={this.props.onGoHome}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Kembali ke Beranda</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
