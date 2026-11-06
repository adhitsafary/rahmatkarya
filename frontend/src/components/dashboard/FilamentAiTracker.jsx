import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  RefreshCw,
  Key,
  Send,
  Copy,
  Eye,
  EyeOff,
  AlertCircle
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
      text: 'Halo! Saya asisten finansial cerdas Google Gemini yang terhubung langsung dengan portofolio proyek dan arus kas Rahmat-Karya Anda.\n\nAnda dapat menanyakan hal seperti:\n• "Analisis risiko pembayaran pada proyek aktif saat ini"\n• "Buatkan draf pesan WhatsApp sopan untuk menagih termin klien yang belum bayar"\n• "Apakah kas kita cukup aman untuk membayar honor tim bulan ini?"\n\nSilakan masukkan Google Gemini API Key Anda di atas untuk mulai berkonsultasi!',
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
    try {
      const res = await apiGetGeminiKey();
      if (res.success && res.data) {
        setHasKey(res.data.has_key);
        setSavedKeyMasked(res.data.key_masked || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!geminiApiKey.trim()) return;
    try {
      const res = await apiSaveGeminiKey(geminiApiKey.trim());
      if (res.success) {
        if (showToast) showToast('Google Gemini API Key berhasil disimpan!');
        setGeminiApiKey('');
        fetchKeyStatus();
      } else {
        if (showToast) showToast(res.message || 'Gagal menyimpan key.', 'error');
      }
    } catch (e) {
      if (showToast) showToast('Gagal menghubungi server.', 'error');
    }
  };

  const handleTestKey = async () => {
    setGeminiTesting(true);
    try {
      const res = await apiTestGeminiKey();
      if (res.success) {
        if (showToast) showToast('Koneksi Google Gemini berhasil!');
      } else {
        if (showToast) showToast(res.message || 'Koneksi Gemini gagal.', 'error');
      }
    } catch (e) {
      if (showToast) showToast('Gagal menguji koneksi.', 'error');
    } finally {
      setGeminiTesting(false);
    }
  };

  const handleSendPrompt = async (presetText = null) => {
    const textToSend = presetText || promptInput;
    if (!textToSend.trim() || geminiLoading) return;

    const userMessage = {
      role: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversation(prev => [...prev, userMessage]);
    if (!presetText) setPromptInput('');
    setGeminiLoading(true);

    try {
      const res = await apiGeminiPrompt(userMessage.text, includeContext);
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (res.success && res.data && res.data.response) {
        setConversation(prev => [...prev, {
          role: 'model',
          text: res.data.response,
          time: replyTime
        }]);
      } else {
        setConversation(prev => [...prev, {
          role: 'model',
          text: (res.message || 'Gagal memproses prompt.'),
          time: replyTime,
          isError: true
        }]);
      }
    } catch (e) {
      setConversation(prev => [...prev, {
        role: 'model',
        text: 'Terjadi kesalahan jaringan.',
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
    <div className="space-y-4">
      
      {/* 1. Header Banner: Clean Minimalist SaaS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              AI Payment Tracker & Audit
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              AUDIT ENGINE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Deteksi dini anomali kas, risiko defisit, duplikasi input, dan audit kepatuhan termin pembayaran.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchAiData} 
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Perbarui Audit</span>
          </button>
        </div>
      </div>

      {/* 2. Pill Segmented Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs overflow-x-auto scrollbar-none">
        {[
          { id: 'summary', label: 'Ringkasan Audit', badge: aiData?.counts?.total_anomalies },
          { id: 'project', label: 'Audit per Proyek' },
          { id: 'simulator', label: 'Simulator Transaksi' },
          { id: 'gemini', label: 'Asisten AI Gemini', hasDot: hasKey }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold transition whitespace-nowrap flex items-center justify-center gap-2 ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-mono">
                {tab.badge}
              </span>
            )}
            {tab.hasDot && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            )}
          </button>
        ))}
      </div>

      {/* ============================================================= */}
      {/* TAB 1: SUMMARY & ANOMALIES                                    */}
      {/* ============================================================= */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          
          {/* Executive Narration Callout */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Ringkasan Analisis Finansial AI
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {aiData?.analyzed_at || ''}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {aiData?.executive_narration?.replace(/\*\*(.*?)\*\*/g, '$1') || 'Memuat analisis keuangan AI...'}
            </p>
          </div>

          {/* 4 KPI Cards: Pure White Minimalist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Skor Integritas */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
              <span className="text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                Skor Integritas Sistem
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight mb-2">
                {aiData ? `${aiData.system_health_score}/100` : '—'}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className={`w-2 h-2 rounded-full ${aiData?.risk_tier === 'CRITICAL' ? 'bg-rose-500' : (aiData?.risk_tier === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500')} shrink-0`}></span>
                <span>{aiData?.risk_badge_text || 'Status Normal'}</span>
              </div>
            </div>

            {/* Card 2: Anomali Kritis */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
              <span className="text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                Anomali Kritis
              </span>
              <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 tracking-tight mb-2">
                {aiData?.counts?.critical || 0}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span>Defisit kas & overpayment</span>
              </div>
            </div>

            {/* Card 3: Peringatan */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
              <span className="text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                Peringatan Sistem
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight mb-2">
                {aiData?.counts?.warning || 0}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                <span>Potensi duplikasi / deadline</span>
              </div>
            </div>

            {/* Card 4: Proyek Bersih */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition">
              <span className="text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                Proyek Bersih
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight mb-2">
                {aiData?.counts ? `${aiData.counts.clean_projects}/${aiData.counts.total_projects}` : '—'}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span>100% tervalidasi aman</span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Daftar Temuan Kesalahan & Anomali ({filteredAnomalies().length})
            </h3>

            <div className="flex items-center gap-1.5 text-xs">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'CRITICAL', label: 'Kritis' },
                { id: 'WARNING', label: 'Peringatan' },
                { id: 'INFO', label: 'Rekomendasi' }
              ].map(f => (
                <button 
                  key={f.id}
                  onClick={() => setIssueFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    issueFilter === f.id 
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Anomaly Cards List */}
          <div className="space-y-3">
            {filteredAnomalies().map((item) => (
              <div 
                key={item.id}
                className={`p-5 rounded-2xl border transition bg-white dark:bg-slate-900 ${
                  item.severity === 'CRITICAL' 
                    ? 'border-rose-200 dark:border-rose-900' 
                    : item.severity === 'WARNING' 
                    ? 'border-amber-200 dark:border-amber-900' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase">
                      Proyek: {item.project_name} ({item.client_name})
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider self-start ${
                    item.severity === 'CRITICAL' 
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                      : item.severity === 'WARNING' 
                      ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {item.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  {item.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs mb-3">
                  <div>
                    <span className="font-semibold text-slate-400 block text-[10px] uppercase">Dampak Finansial:</span>
                    <span className="text-slate-700 dark:text-slate-300">{item.impact}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 block text-[10px] uppercase">Rekomendasi AI:</span>
                    <span className="text-slate-700 dark:text-slate-300">{item.solution}</span>
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
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <span>{item.action_label}</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredAnomalies().length === 0 && (
              <div className="text-center py-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Tidak ada anomali terdeteksi</h4>
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
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Pilih Proyek:
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="w-full text-xs font-semibold border rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
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
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {projectAudit.project.project_name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Klien: {projectAudit.project.client_name} • Kontak: {projectAudit.project.client_phone || 'Belum diisi'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Skor Kepatuhan</span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {projectAudit.audit ? `${projectAudit.audit.score}/100` : '100/100'}
                  </span>
                </div>
              </div>

              {/* Checklist 5 Poin Keamanan */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] pb-2 border-b border-slate-100 dark:border-slate-800">
                  Checklist 5 Poin Keamanan Finansial
                </h4>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300">1. Batas Pembayaran Klien (Overbilling Protection)</span>
                  <span className={`font-semibold ${parseFloat(projectAudit.project.total_paid_by_client) > parseFloat(projectAudit.project.total_contract_value) ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {parseFloat(projectAudit.project.total_paid_by_client) > parseFloat(projectAudit.project.total_contract_value) ? 'Melebihi Kontrak' : 'Sesuai Kontrak'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300">2. Saldo Kas Bersih (Anti Talangan Kas Pribadi)</span>
                  <span className={`font-semibold ${parseFloat(projectAudit.project.net_cash_in_hand) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {parseFloat(projectAudit.project.net_cash_in_hand) < 0 ? 'Kas Defisit (Perlu Penagihan)' : 'Kas Positif Aman'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300">3. Plafon Honor Tim vs Kontrak</span>
                  <span className="font-semibold text-emerald-600">
                    Margin {projectAudit.project.profit_margin_percentage}%
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-300">4. Integritas Duplikasi Nominal Transaksi</span>
                  <span className={`font-semibold ${projectAudit.anomalies?.some(a => a.type.includes('DUPLICATE')) ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {projectAudit.anomalies?.some(a => a.type.includes('DUPLICATE')) ? 'Potensi Input Ganda' : 'Bersih Tervalidasi'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-600 dark:text-slate-300">5. Saluran Penagihan (No Telepon WhatsApp)</span>
                  <span className={`font-semibold ${!projectAudit.project.client_phone ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {!projectAudit.project.client_phone ? 'No WA Belum Diisi' : 'Nomor Valid'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!selectedProjectId && (
            <div className="text-center py-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Pilih Proyek dari Menu Dropdown di Atas</h4>
              <p className="text-xs text-slate-400 mt-1">Sistem akan melakukan audit 5 poin keamanan finansial secara mendalam.</p>
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
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              Form Simulasi Transaksi Kas (What-If Analysis)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Target Proyek *</label>
                <select
                  value={simForm.project_id}
                  onChange={(e) => {
                    setSimResult(null);
                    setSimForm({ ...simForm, project_id: e.target.value });
                    if (e.target.value) handleSelectProject(e.target.value);
                  }}
                  required
                  className="w-full font-semibold border rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">-- Pilih Proyek --</option>
                  {projects.map(p => (
                    <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">Jenis Transaksi *</label>
                <select
                  value={simForm.type}
                  onChange={(e) => {
                    setSimResult(null);
                    setSimForm({ ...simForm, type: e.target.value });
                  }}
                  className="w-full font-semibold border rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="CLIENT_PAYMENT">Pemasukan Klien (Cash-In)</option>
                  <option value="TEAM_PAYMENT">Pencairan Honor Tim (Cash-Out)</option>
                </select>
              </div>
            </div>

            {simForm.type === 'TEAM_PAYMENT' && projectAudit?.team_members?.length > 0 && (
              <div>
                <label className="block font-semibold text-slate-500 mb-1">Pilih Anggota Tim Penerima *</label>
                <select
                  value={simForm.member_id}
                  onChange={(e) => setSimForm({ ...simForm, member_id: e.target.value })}
                  className="w-full font-semibold border rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
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
              <label className="block font-semibold text-slate-500 mb-1">Nominal Transaksi (Rp) *</label>
              <input
                type="number"
                value={simForm.amount}
                onChange={(e) => setSimForm({ ...simForm, amount: e.target.value })}
                required
                placeholder="Contoh: 2500000"
                className="w-full font-bold font-mono text-sm border rounded-xl px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={simLoading}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {simLoading ? 'Menganalisis...' : 'Jalankan Simulasi'}
              </button>
            </div>
          </form>

          {/* Result Card */}
          {simResult && (
            <div className={`p-5 rounded-2xl border transition bg-white dark:bg-slate-900 ${simResult.is_safe ? 'border-emerald-200 dark:border-emerald-800' : 'border-rose-200 dark:border-rose-800'} space-y-3 text-xs`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-bold ${simResult.is_safe ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                    {simResult.is_safe ? 'Hasil Simulasi: Aman untuk Dieksekusi' : 'Hasil Simulasi: Risiko Terdeteksi'}
                  </h4>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${simResult.is_safe ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`}>
                  {simResult.verdict}
                </span>
              </div>

              {simResult.warnings?.map((w, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium border border-rose-200 dark:border-rose-900">
                  {w}
                </div>
              ))}

              {simResult.suggestions?.map((s, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-900">
                  {s}
                </div>
              ))}

              {simResult.simulated_state && (
                <div className="grid grid-cols-2 gap-2 text-center pt-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Kas di Tangan Setelah Transaksi:</span>
                    <span className={`font-mono font-bold text-xs ${simResult.simulated_state.new_net_cash < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatRupiah(simResult.simulated_state.new_net_cash)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 block font-semibold">Status Piutang / Hak Tim:</span>
                    <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
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
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs transition active:scale-95 cursor-pointer"
                >
                  Terapkan ke Transaksi Nyata
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: TANYA AI GEMINI                                        */}
      {/* ============================================================= */}
      {activeTab === 'gemini' && (
        <div className="space-y-4">
          
          {/* 1. Gemini API Key Setting Card: Clean Slate */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Google Gemini API Key</h4>
                <p className="text-[11px] text-slate-400">Kunci API tersimpan di browser & server secara aman</p>
              </div>

              <div>
                {hasKey ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    API Key Tersedia
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
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
                    className="w-full text-xs font-mono rounded-xl px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
                    title={showKey ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs transition active:scale-95 shadow-xs whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Simpan Key</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={geminiTesting || (!geminiApiKey && !hasKey)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-xs transition active:scale-95 disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${geminiTesting ? 'animate-spin' : ''}`} />
                    <span>{geminiTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
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
                <div className={`p-4 rounded-2xl max-w-2xl ${
                  msg.role === 'user'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-tr-none'
                    : msg.isError
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900 rounded-tl-none'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none'
                }`}>
                  <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-black/5 dark:border-white/10">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                      {msg.role === 'user' ? 'Anda' : 'Asisten Keuangan Gemini AI'}
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
              </div>
            ))}

            {geminiLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold p-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gemini sedang menganalisis arus kas...</span>
              </div>
            )}
          </div>

          {/* 3. Quick Prompts Chips */}
          <div>
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">Pertanyaan Cepat:</span>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={geminiLoading}
                  onClick={() => handleSendPrompt(chip)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition active:scale-95 disabled:opacity-50 text-left cursor-pointer"
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
                className="w-full text-xs font-medium rounded-xl p-3 pr-24 border bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none"
              />
              
              <button
                type="submit"
                disabled={geminiLoading || !promptInput.trim()}
                className="absolute right-2.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs shadow-xs transition active:scale-95 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
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
                  className="rounded text-slate-900 focus:ring-0"
                />
                <span>Sertakan Data Arus Kas & Portofolio Proyek Terkini dalam Prompt</span>
              </label>
              <span>Model: Google Gemini Flash</span>
            </div>
          </form>

        </div>
      )}

    </div>
  );
}
