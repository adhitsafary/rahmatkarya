import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Play, 
  ArrowRight, 
  Search, 
  RefreshCw,
  ExternalLink,
  Phone,
  Key,
  Send,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatRupiah } from '../../utils/format';
import { 
  apiGetAiAnalysis, 
  apiGetAiProjectAnalysis, 
  apiValidatePayment,
  apiGetGeminiKey,
  apiSaveGeminiKey,
  apiTestGeminiKey,
  apiGeminiPrompt
} from '../../services/api';

export default function FilamentAiTracker({
  projects = [],
  onOpenWhatsApp,
  onOpenPayment,
  onOpenDetail,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'project' | 'simulator' | 'gemini'
  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [issueFilter, setIssueFilter] = useState('all');

  // Deep dive
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectAudit, setProjectAudit] = useState(null);
  const [projectLoading, setProjectLoading] = useState(false);

  // Simulator
  const [simForm, setSimForm] = useState({
    project_id: '',
    type: 'CLIENT_PAYMENT',
    amount: '',
    member_id: ''
  });
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Gemini AI State
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [savedKeyMasked, setSavedKeyMasked] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);
  const [conversation, setConversation] = useState([
    {
      role: 'model',
      text: 'Halo! Saya asisten finansial cerdas Google Gemini yang terhubung langsung dengan portofolio proyek dan arus kas ProCash Anda.\n\nAnda dapat menanyakan hal seperti:\n• "Analisis risiko pembayaran pada proyek aktif saat ini"\n• "Buatkan draf pesan WhatsApp sopan untuk menagih termin klien yang belum bayar"\n• "Apakah kas kita cukup aman untuk membayar honor tim bulan ini?"\n\nSilakan masukkan Google Gemini API Key Anda di atas untuk mulai berkonsultasi!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const quickPrompts = [
    "Analisis risiko keuangan & piutang saat ini",
    "Draf WA sopan untuk penagihan klien yang tertunda",
    "Apakah kas cukup aman untuk bayar honor tim?",
    "Rekomendasi prioritas penagihan & pembayaran minggu ini"
  ];

  const fetchAiData = async () => {
    setLoading(true);
    try {
      const res = await apiGetAiAnalysis();
      if (res.success) {
        setAiData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiData();
    fetchKeyStatus();
  }, []);

  const fetchKeyStatus = async () => {
    const local = localStorage.getItem('gemini_api_key');
    if (local && local.length > 5) {
      setGeminiApiKey(local);
      setHasKey(true);
      setSavedKeyMasked(local.substring(0, 4) + '••••••••' + local.substring(local.length - 4));
    }
    try {
      const res = await apiGetGeminiKey();
      if (res.success && res.data?.has_key) {
        setHasKey(true);
        setSavedKeyMasked(res.data.masked_key);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveKey = async (e) => {
    if (e) e.preventDefault();
    const key = geminiApiKey.trim();
    try {
      const res = await apiSaveGeminiKey(key);
      if (res.success) {
        if (key) {
          localStorage.setItem('gemini_api_key', key);
          setHasKey(true);
          setSavedKeyMasked(key.substring(0, 4) + '••••••••' + key.substring(key.length - 4));
          if (showToast) showToast('Google Gemini API Key berhasil disimpan!');
        } else {
          localStorage.removeItem('gemini_api_key');
          setHasKey(false);
          setSavedKeyMasked('');
          if (showToast) showToast('Google Gemini API Key dihapus.');
        }
      } else {
        if (showToast) showToast(res.message || 'Gagal menyimpan key.', true);
      }
    } catch (e) {
      if (showToast) showToast('Gagal menghubungi server.', true);
    }
  };

  const handleTestKey = async () => {
    setGeminiTesting(true);
    try {
      const res = await apiTestGeminiKey(geminiApiKey.trim());
      if (res.success) {
        if (showToast) showToast('Koneksi Google Gemini API Berhasil! (' + (res.data?.model || 'Gemini') + ')');
      } else {
        if (showToast) showToast(res.message || 'Koneksi gagal.', true);
      }
    } catch (e) {
      if (showToast) showToast('Gagal menguji koneksi.', true);
    } finally {
      setGeminiTesting(false);
    }
  };

  const handleSendPrompt = async (customText = null) => {
    const text = (customText !== null ? customText : promptInput).trim();
    if (!text || geminiLoading) return;

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newHistory = [...conversation, { role: 'user', text, time: nowStr }];
    setConversation(newHistory);
    if (customText === null) setPromptInput('');
    setGeminiLoading(true);

    const apiHistory = newHistory.filter(m => !m.isError).map(m => ({ role: m.role, text: m.text }));

    try {
      const res = await apiGeminiPrompt(text, apiHistory, geminiApiKey.trim(), includeContext);
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (res.success) {
        setConversation(prev => [...prev, {
          role: 'model',
          text: res.data.reply,
          time: replyTime
        }]);
      } else {
        setConversation(prev => [...prev, {
          role: 'model',
          text: '⚠️ ' + (res.message || 'Gagal memproses prompt.'),
          time: replyTime,
          isError: true
        }]);
      }
    } catch (e) {
      setConversation(prev => [...prev, {
        role: 'model',
        text: '⚠️ Terjadi kesalahan jaringan.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      }]);
    } finally {
      setGeminiLoading(false);
    }
  };

  const handleCopyText = (txt) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(txt);
      if (showToast) showToast('Jawaban AI disalin!');
    }
  };

  const handleSelectProject = async (id) => {
    setSelectedProjectId(id);
    if (!id) {
      setProjectAudit(null);
      return;
    }
    setProjectLoading(true);
    try {
      const res = await apiGetAiProjectAnalysis(id);
      if (res.success) {
        setProjectAudit(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProjectLoading(false);
    }
  };

  const handleRunSim = async (e) => {
    e.preventDefault();
    if (!simForm.project_id || !simForm.amount || parseFloat(simForm.amount) <= 0) {
      if (showToast) showToast('Pilih proyek dan masukkan nominal simulasi (> 0).', 'error');
      return;
    }
    setSimLoading(true);
    try {
      const res = await apiValidatePayment(simForm);
      if (res.success) {
        setSimResult(res.data);
      } else {
        if (showToast) showToast(res.message, 'error');
      }
    } catch (e) {
      if (showToast) showToast('Gagal menjalankan simulasi.', 'error');
    } finally {
      setSimLoading(false);
    }
  };

  const handleApplySim = () => {
    if (!simForm.project_id) return;
    const p = projects.find(item => item.project_id == simForm.project_id);
    if (!p) return;
    if (simForm.type === 'CLIENT_PAYMENT' && onOpenPayment) {
      onOpenPayment(p);
    } else if (onOpenDetail) {
      onOpenDetail(p);
    }
    if (showToast) showToast('Hasil simulasi diterapkan.');
  };

  const filteredAnomalies = () => {
    if (!aiData || !aiData.anomalies) return [];
    if (issueFilter === 'all') return aiData.anomalies;
    return aiData.anomalies.filter(a => a.severity === issueFilter);
  };

  return (
    <div className="space-y-5">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-inner">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">AI Payment Tracker & Audit</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-indigo-200 border border-white/20">
                  Filament Engine
                </span>
              </div>
              <p className="text-xs text-indigo-200/90 mt-1 max-w-xl">
                Sistem pintar pendeteksi overpayment klien, overpay tim, duplikasi input, risiko defisit kas, dan audit kepatuhan deadline.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={fetchAiData} 
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Audit</span>
            </button>
          </div>
        </div>

        {/* Subtle Ambient lights */}
        <div className="absolute -right-16 -top-16 w-60 h-60 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"></div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-bold">
        <button 
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 ${activeTab === 'summary' ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-black' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
        >
          <span>📊</span>
          <span>Ringkasan Audit Global</span>
          {aiData?.counts?.total_anomalies > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-mono">
              {aiData.counts.total_anomalies}
            </span>
          )}
        </button>

        <button 
          onClick={() => setActiveTab('project')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 ${activeTab === 'project' ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-black' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
        >
          <span>🎯</span>
          <span>Audit per Proyek</span>
        </button>

        <button 
          onClick={() => setActiveTab('simulator')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 ${activeTab === 'simulator' ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-black' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
        >
          <span>🧪</span>
          <span>Simulator Transaksi AI</span>
        </button>

        <button 
          onClick={() => setActiveTab('gemini')}
          className={`flex-1 py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 ${activeTab === 'gemini' ? 'bg-white dark:bg-indigo-600 text-indigo-700 dark:text-white shadow-xs font-black' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
        >
          <span>✨</span>
          <span>Tanya AI Gemini</span>
          <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: SUMMARY & ANOMALIES                                    */}
      {/* ============================================================= */}
      {activeTab === 'summary' && (
        <div className="space-y-5">
          {/* Executive Narration */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-blue-50/90 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/40 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
                AI Executive Insight
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {aiData?.analyzed_at || ''}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              {aiData?.executive_narration?.replace(/\*\*(.*?)\*\*/g, '$1') || 'Memuat analisis keuangan AI...'}
            </p>
          </div>

          {/* 4 KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Skor Integritas</span>
              <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {aiData ? `${aiData.system_health_score}/100` : '—'}
              </div>
              <span className={`text-[10px] font-bold ${aiData?.risk_tier === 'CRITICAL' ? 'text-rose-600' : (aiData?.risk_tier === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600')}`}>
                {aiData?.risk_badge_text || 'Normal'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block mb-1">Anomali Kritis</span>
              <div className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                {aiData?.counts?.critical || 0}
              </div>
              <span className="text-[10px] text-rose-500 font-medium">Defisit & overpay</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block mb-1">Peringatan</span>
              <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-400">
                {aiData?.counts?.warning || 0}
              </div>
              <span className="text-[10px] text-amber-600 font-medium">Duplikasi / deadline</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block mb-1">Proyek Bersih</span>
              <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
                {aiData?.counts ? `${aiData.counts.clean_projects}/${aiData.counts.total_projects}` : '—'}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">100% aman tervalidasi</span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              <span>Daftar Temuan Kesalahan & Anomali ({filteredAnomalies().length})</span>
            </h3>

            <div className="flex items-center gap-1.5 text-xs">
              <button 
                onClick={() => setIssueFilter('all')}
                className={`px-3 py-1 rounded-xl transition ${issueFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
              >Semua</button>
              <button 
                onClick={() => setIssueFilter('CRITICAL')}
                className={`px-3 py-1 rounded-xl transition ${issueFilter === 'CRITICAL' ? 'bg-rose-600 text-white font-bold' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`}
              >🔴 Kritis</button>
              <button 
                onClick={() => setIssueFilter('WARNING')}
                className={`px-3 py-1 rounded-xl transition ${issueFilter === 'WARNING' ? 'bg-amber-600 text-white font-bold' : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}
              >🟡 Peringatan</button>
              <button 
                onClick={() => setIssueFilter('INFO')}
                className={`px-3 py-1 rounded-xl transition ${issueFilter === 'INFO' ? 'bg-blue-600 text-white font-bold' : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'}`}
              >🔵 Rekomendasi</button>
            </div>
          </div>

          {/* Anomaly Cards List */}
          <div className="space-y-3">
            {filteredAnomalies().map((item) => (
              <div 
                key={item.id}
                className={`p-5 rounded-2xl border transition ${
                  item.severity === 'CRITICAL' 
                    ? 'bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/50' 
                    : item.severity === 'WARNING' 
                    ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50' 
                    : 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase">
                      Proyek: {item.project_name} ({item.client_name})
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider self-start ${
                    item.severity === 'CRITICAL' 
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200' 
                      : item.severity === 'WARNING' 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {item.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                  {item.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 text-xs mb-3">
                  <div>
                    <span className="font-bold text-slate-400 block text-[10px] uppercase">Dampak Finansial:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.impact}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 block text-[10px] uppercase">Rekomendasi AI:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.solution}</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={() => {
                      const p = projects.find(x => x.project_id == item.project_id);
                      if (!p) return;
                      if (item.action_type === 'OPEN_WA' && onOpenWhatsApp) onOpenWhatsApp(p);
                      else if (item.action_type === 'OPEN_TEAM' && onOpenDetail) onOpenDetail(p);
                      else if (onOpenDetail) onOpenDetail(p);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition active:scale-95 ${
                      item.severity === 'CRITICAL' ? 'bg-rose-600 hover:bg-rose-700' : (item.severity === 'WARNING' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700')
                    }`}
                  >
                    <span>⚡</span>
                    <span>{item.action_label}</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredAnomalies().length === 0 && (
              <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Tidak ada anomali terdeteksi</h4>
                <p className="text-xs text-slate-400 mt-1">Seluruh transaksi pembukuan memenuhi standar kepatuhan kas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: AUDIT PER PROYEK                                       */}
      {/* ============================================================= */}
      {activeTab === 'project' && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Pilih Proyek:
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="w-full text-xs font-bold border rounded-2xl px-4 py-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="">-- Pilih Proyek yang Ingin Diaudit --</option>
              {projects.map(p => (
                <option key={p.project_id} value={p.project_id}>
                  {p.project_name} • Klien: {p.client_name}
                </option>
              ))}
            </select>
          </div>

          {projectAudit && projectAudit.project && (
            <div className="space-y-4 pt-2">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {projectAudit.project.project_name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Klien: {projectAudit.project.client_name} • Kontak: {projectAudit.project.client_phone || 'Belum diisi'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Skor Kesehatan</span>
                  <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                    {projectAudit.audit ? `${projectAudit.audit.score}/100` : '100/100'}
                  </span>
                </div>
              </div>

              {/* Checklist 5 Poin Keamanan */}
              <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2">
                  🛡️ Checklist 5 Poin Keamanan Finansial
                </h4>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800">
                  <span>1. Batas Pembayaran Klien (Overbilling Protection)</span>
                  <span className={`font-bold ${parseFloat(projectAudit.project.total_paid_by_client) > parseFloat(projectAudit.project.total_contract_value) ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {parseFloat(projectAudit.project.total_paid_by_client) > parseFloat(projectAudit.project.total_contract_value) ? '⚠️ Melebihi Kontrak' : '✓ Sesuai Kontrak'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800">
                  <span>2. Saldo Kas Bersih (Anti Talangan Kas Pribadi)</span>
                  <span className={`font-bold ${parseFloat(projectAudit.project.net_cash_in_hand) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {parseFloat(projectAudit.project.net_cash_in_hand) < 0 ? '🔴 Kas Defisit (Talangan Aktif)' : '✓ Kas Positif Aman'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800">
                  <span>3. Plafon Honor Tim vs Kontrak</span>
                  <span className="font-bold text-emerald-600">
                    ✓ Margin {projectAudit.project.profit_margin_percentage}%
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-200/60 dark:border-slate-800">
                  <span>4. Integritas Duplikasi Nominal Transaksi</span>
                  <span className={`font-bold ${projectAudit.anomalies?.some(a => a.type.includes('DUPLICATE')) ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {projectAudit.anomalies?.some(a => a.type.includes('DUPLICATE')) ? '🟡 Potensi Input Ganda' : '✓ Bersih'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span>5. Saluran Penagihan (No Telepon WhatsApp)</span>
                  <span className={`font-bold ${!projectAudit.project.client_phone ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {!projectAudit.project.client_phone ? '🟡 No WA Kosong' : '✓ Siap Tagih'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!selectedProjectId && (
            <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
              <Bot className="w-10 h-10 text-indigo-500 mx-auto mb-2 opacity-80" />
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Pilih Proyek dari Menu Dropdown</h4>
              <p className="text-xs text-slate-400 mt-1">AI akan melakukan audit 5 poin keamanan finansial secara mendalam.</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: SIMULATOR TRANSAKSI                                    */}
      {/* ============================================================= */}
      {activeTab === 'simulator' && (
        <div className="space-y-4">
          <form onSubmit={handleRunSim} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2">
              🧪 Form Simulasi Transaksi Kas (What-If Analysis)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Target Proyek *</label>
                <select
                  value={simForm.project_id}
                  onChange={(e) => {
                    setSimResult(null);
                    setSimForm({ ...simForm, project_id: e.target.value });
                    if (e.target.value) handleSelectProject(e.target.value);
                  }}
                  required
                  className="w-full font-bold border rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- Pilih Proyek --</option>
                  {projects.map(p => (
                    <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Jenis Transaksi *</label>
                <select
                  value={simForm.type}
                  onChange={(e) => {
                    setSimResult(null);
                    setSimForm({ ...simForm, type: e.target.value });
                  }}
                  className="w-full font-bold border rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="CLIENT_PAYMENT">Pemasukan Klien (Cash-In)</option>
                  <option value="TEAM_PAYMENT">Pencairan Honor Tim (Cash-Out)</option>
                </select>
              </div>
            </div>

            {simForm.type === 'TEAM_PAYMENT' && projectAudit?.team_members?.length > 0 && (
              <div>
                <label className="block font-bold text-slate-500 mb-1">Pilih Anggota Tim Penerima *</label>
                <select
                  value={simForm.member_id}
                  onChange={(e) => setSimForm({ ...simForm, member_id: e.target.value })}
                  className="w-full font-bold border rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- Pilih Rekan Tim --</option>
                  {projectAudit.team_members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.member_name} ({m.member_role || 'Tim'}) - Sisa Honor: {formatRupiah(m.remaining_honor)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-500 mb-1">Nominal Transaksi (Rp) *</label>
              <input
                type="number"
                value={simForm.amount}
                onChange={(e) => setSimForm({ ...simForm, amount: e.target.value })}
                required
                placeholder="Contoh: 2500000"
                className="w-full font-black font-mono text-sm border rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={simLoading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition active:scale-95 disabled:opacity-50"
              >
                {simLoading ? 'Menganalisis...' : 'Jalankan Simulasi AI'}
              </button>
            </div>
          </form>

          {/* Result Card */}
          {simResult && (
            <div className={`p-5 rounded-2xl border transition ${simResult.is_safe ? 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800' : 'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800'} space-y-3 text-xs`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{simResult.is_safe ? '✅' : '⚠️'}</span>
                  <h4 className={`text-sm font-black ${simResult.is_safe ? 'text-emerald-900 dark:text-emerald-300' : 'text-rose-900 dark:text-rose-300'}`}>
                    {simResult.is_safe ? 'HASIL SIMULASI: AMAN UNTUK DIEKSEKUSI' : 'HASIL SIMULASI: RISIKO TERDETEKSI!'}
                  </h4>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${simResult.is_safe ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200'}`}>
                  {simResult.verdict}
                </span>
              </div>

              {simResult.warnings?.map((w, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900">
                  {w}
                </div>
              ))}

              {simResult.suggestions?.map((s, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-900">
                  {s}
                </div>
              ))}

              {simResult.simulated_state && (
                <div className="grid grid-cols-2 gap-2 text-center pt-2">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Kas di Tangan Setelah Transaksi:</span>
                    <span className={`font-mono font-black text-xs ${simResult.simulated_state.new_net_cash < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatRupiah(simResult.simulated_state.new_net_cash)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 block font-bold">Status Piutang / Hak Tim:</span>
                    <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                      {simForm.type === 'CLIENT_PAYMENT' 
                        ? formatRupiah(simResult.simulated_state.new_receivable)
                        : formatRupiah(simResult.simulated_state.new_remaining_honor || 0)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleApplySim}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold text-xs transition active:scale-95"
                >
                  🚀 Terapkan ke Form Nyata
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: TANYA AI GEMINI (PROMPT ASSISTANT & KEY INPUT)         */}
      {/* ============================================================= */}
      {activeTab === 'gemini' && (
        <div className="space-y-4">
          
          {/* 1. Gemini API Key Setting Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md border border-indigo-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-sm font-black shadow-inner">
                  ✦
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">Google Gemini API Key</h4>
                  <p className="text-[11px] text-indigo-200">Kunci API tersimpan di browser & server secara aman</p>
                </div>
              </div>

              <div>
                {hasKey ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    API Key Tersedia
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    Belum Ada API Key
                  </span>
                )}
              </div>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder={savedKeyMasked ? `Tersimpan: ${savedKeyMasked}` : 'Masukkan AIzaSy... dari Google AI Studio'}
                    className="w-full text-xs font-mono rounded-xl px-3.5 py-2.5 bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition"
                    title={showKey ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition active:scale-95 shadow-sm whitespace-nowrap flex items-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Simpan Key</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={geminiTesting || (!geminiApiKey && !hasKey)}
                    className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-extrabold text-xs transition active:scale-95 disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${geminiTesting ? 'animate-spin' : ''}`} />
                    <span>{geminiTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-indigo-300/80 pt-1">
                <span>Dapatkan API Key gratis di Google AI Studio (aistudio.google.com)</span>
                {savedKeyMasked && (
                  <span className="font-mono text-[10px]">Tersimpan: {savedKeyMasked}</span>
                )}
              </div>
            </form>
          </div>

          {/* 2. Interactive AI Consultation Chat Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 max-h-[500px] overflow-y-auto">
            {conversation.map((msg, index) => (
              <div 
                key={index} 
                className={`flex gap-3 text-xs ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm mt-0.5">
                    ✦
                  </div>
                )}

                <div className={`p-4 rounded-2xl max-w-2xl ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : msg.isError
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900 rounded-tl-none'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 rounded-tl-none'
                }`}>
                  <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-black/5 dark:border-white/10">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${msg.role === 'user' ? 'text-blue-200' : 'text-indigo-600 dark:text-indigo-400'}`}>
                      {msg.role === 'user' ? 'Anda' : 'Gemini AI Consultant'}
                    </span>
                    <div className="flex items-center gap-2 text-[9px] opacity-75">
                      <span>{msg.time}</span>
                      {msg.role === 'model' && !msg.isError && (
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.text)}
                          className="hover:text-blue-500 transition"
                          title="Salin Teks"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap leading-relaxed text-xs">
                    {msg.text}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    U
                  </div>
                )}
              </div>
            ))}

            {geminiLoading && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold p-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gemini sedang berpikir & menganalisis arus kas...</span>
              </div>
            )}
          </div>

          {/* 3. Quick Prompts Chips */}
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Pertanyaan Cepat (1-Klik):</span>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={geminiLoading}
                  onClick={() => handleSendPrompt(chip)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-white border border-slate-200/80 dark:border-slate-700/80 text-[11px] font-medium transition active:scale-95 disabled:opacity-50 text-left"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Prompt Input Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendPrompt(); }}
            className="space-y-2"
          >
            <div className="relative flex items-center">
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendPrompt();
                  }
                }}
                rows={2}
                placeholder="Tanyakan analisis kas, draf penagihan WA, atau risiko proyek ke Gemini AI (Enter untuk kirim)..."
                className="w-full text-xs font-medium rounded-2xl p-3 pr-24 border bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
              
              <button
                type="submit"
                disabled={geminiLoading || !promptInput.trim()}
                className="absolute right-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-xs shadow-sm transition active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
              >
                <span>Kirim</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeContext}
                  onChange={(e) => setIncludeContext(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                <span>Sertakan Data Arus Kas & Portofolio Proyek Terkini dalam Prompt</span>
              </label>
              <span>Model: Google Gemini 1.5/2.0 Flash</span>
            </div>
          </form>

        </div>
      )}

    </div>
  );
}
