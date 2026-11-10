import React, { useState, useEffect, useRef } from 'react';
import { 
  Key,
  Send,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Database,
  Filter,
  Search,
  Plus,
  PanelLeft,
  X
} from 'lucide-react';
import { 
  apiGetGeminiKey, 
  apiSaveGeminiKey, 
  apiTestGeminiKey, 
  apiGeminiPrompt,
  apiGetGeminiHistory,
  apiGetGeminiSessions,
  apiGetGeminiSessionMessages,
  apiCreateGeminiSession,
  apiDeleteGeminiSession,
  apiClearGeminiHistory,
  apiDeleteGeminiMessage
} from '../../services/api';

export default function FilamentAiTracker({
  projects = [],
  showToast
}) {
  // Gemini AI State
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [savedKeyMasked, setSavedKeyMasked] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [includeContext, setIncludeContext] = useState(true);

  // Chat Sessions & History Sidebar State
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState('Obrolan Baru');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [historySearch, setHistorySearch] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Floating Quick Prompts Popover State
  const [showQuickPrompts, setShowQuickPrompts] = useState(false);
  const quickPromptsRef = useRef(null);

  // Toggle Hide/Show States (default: clean compact view, persistent across sessions)
  const [showKeyCard, setShowKeyCard] = useState(() => {
    const saved = localStorage.getItem('gemini_show_key_card_v2');
    if (saved !== null) return saved === 'true';
    return false; // Default: closed/clean
  });

  const [headerCollapsed, setHeaderCollapsed] = useState(() => {
    const saved = localStorage.getItem('gemini_header_collapsed_v2');
    if (saved !== null) return saved === 'true';
    return true; // Default: collapsed/clean
  });

  // Clean legacy storage keys so new default takes effect
  useEffect(() => {
    localStorage.removeItem('gemini_show_key_card');
    localStorage.removeItem('gemini_header_collapsed');
  }, []);

  const toggleShowKeyCard = () => {
    setShowKeyCard(prev => {
      const next = !prev;
      localStorage.setItem('gemini_show_key_card_v2', next ? 'true' : 'false');
      return next;
    });
  };

  const toggleHeaderCollapsed = () => {
    setHeaderCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('gemini_header_collapsed_v2', next ? 'true' : 'false');
      return next;
    });
  };

  const initialGreeting = {
    role: 'model',
    text: 'Halo! Saya asisten finansial cerdas Google Gemini yang terhubung langsung dengan portofolio proyek dan arus kas Rahmat-Karya Anda.\n\nAnda dapat menanyakan hal seperti:\n• "Analisis risiko pembayaran pada proyek aktif saat ini"\n• "Buatkan draf pesan WhatsApp sopan untuk menagih termin klien yang belum bayar"\n• "Apakah kas kita cukup aman untuk membayar honor tim bulan ini?"\n\nSilakan masukkan Google Gemini API Key Anda di atas untuk mulai berkonsultasi!',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
  };

  const [conversation, setConversation] = useState([initialGreeting]);
  const chatBottomRef = useRef(null);

  const quickPrompts = [
    "Analisis risiko keuangan & piutang saat ini",
    "Draf WA sopan untuk penagihan klien yang tertunda",
    "Apakah kas cukup aman untuk bayar honor tim?",
    "Rekomendasi prioritas penagihan & pembayaran minggu ini"
  ];

  const fetchKeyStatus = async () => {
    try {
      const res = await apiGetGeminiKey();
      if (res.success && res.data) {
        setHasKey(res.data.has_key);
        setSavedKeyMasked(res.data.key_masked || res.data.masked_key || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch all chat sessions from DB
  const fetchSessions = async (autoSelectLatest = false) => {
    try {
      setSessionsLoading(true);
      const res = await apiGetGeminiSessions();
      if (res.success && Array.isArray(res.data)) {
        setSessions(res.data);
        if (autoSelectLatest && res.data.length > 0) {
          const first = res.data[0];
          setActiveSessionId(first.session_id);
          setActiveSessionTitle(first.title);
          loadSessionMessages(first.session_id);
        } else if (res.data.length === 0) {
          setConversation([initialGreeting]);
        }
      }
    } catch (e) {
      console.error('Failed to load chat sessions:', e);
    } finally {
      setSessionsLoading(false);
    }
  };

  // Load messages for a specific session
  const loadSessionMessages = async (sessionId) => {
    if (!sessionId) return;
    try {
      setHistoryLoading(true);
      const res = await apiGetGeminiSessionMessages(sessionId);
      if (res.success && Array.isArray(res.data)) {
        const loaded = res.data.map(m => ({
          id: m.id,
          session_id: m.session_id,
          role: m.role,
          text: m.text || m.message,
          time: m.time || (m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
          date: m.date || (m.created_at ? new Date(m.created_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : ''),
          userName: m.user_name,
          userRole: m.user_role,
          model: m.model,
          isFromDb: true
        }));
        setConversation(loaded.length > 0 ? [initialGreeting, ...loaded] : [initialGreeting]);
      } else {
        setConversation([initialGreeting]);
      }
    } catch (e) {
      console.error('Failed to load session messages:', e);
      setConversation([initialGreeting]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchKeyStatus();
    fetchSessions(true);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation, geminiLoading]);

  // Close mobile drawer or quick prompts popover on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showQuickPrompts) setShowQuickPrompts(false);
        if (mobileDrawerOpen) setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileDrawerOpen, showQuickPrompts]);

  // Click outside listener for floating quick prompts popover
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (quickPromptsRef.current && !quickPromptsRef.current.contains(e.target)) {
        setShowQuickPrompts(false);
      }
    };
    if (showQuickPrompts) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showQuickPrompts]);

  const handleSelectSession = (sessionId) => {
    setMobileDrawerOpen(false);
    if (activeSessionId === sessionId) return;
    const sess = sessions.find(s => s.session_id === sessionId);
    setActiveSessionId(sessionId);
    setActiveSessionTitle(sess?.title || 'Obrolan');
    loadSessionMessages(sessionId);
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setActiveSessionTitle('Obrolan Baru');
    setConversation([initialGreeting]);
    setPromptInput('');
    setMobileDrawerOpen(false);
  };

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('Hapus sesi obrolan ini dari database? Riwayat yang dihapus tidak dapat dipulihkan.')) return;
    try {
      const res = await apiDeleteGeminiSession(sessionId);
      if (res.success) {
        setSessions(prev => prev.filter(s => s.session_id !== sessionId));
        if (activeSessionId === sessionId) {
          handleNewChat();
        }
        if (showToast) showToast('Sesi obrolan berhasil dihapus.');
      } else {
        if (showToast) showToast(res.message || 'Gagal menghapus sesi.', 'error');
      }
    } catch (e) {
      if (showToast) showToast('Koneksi sistem gagal.', 'error');
    }
  };

  const handleClearAllSessions = async () => {
    if (!confirm('Yakin ingin membersihkan SEMUA riwayat obrolan AI dari database? Seluruh sesi percakapan akan dihapus secara permanen.')) return;
    try {
      const res = await apiClearGeminiHistory();
      if (res.success) {
        setSessions([]);
        handleNewChat();
        if (showToast) showToast('Seluruh riwayat obrolan berhasil dibersihkan.');
      } else {
        if (showToast) showToast(res.message || 'Gagal membersihkan riwayat.', 'error');
      }
    } catch (e) {
      if (showToast) showToast('Koneksi sistem gagal.', 'error');
    }
  };

  const handleSaveKey = async (e) => {
    if (e) e.preventDefault();
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
      if (showToast) showToast('Koneksi sistem gagal.', 'error');
    }
  };

  const handleDeleteKey = async () => {
    if (!confirm('Yakin ingin menghapus Google Gemini API Key yang tersimpan?')) return;
    try {
      const res = await apiSaveGeminiKey('');
      if (res.success) {
        if (showToast) showToast('API Key Gemini berhasil dihapus.');
        setGeminiApiKey('');
        fetchKeyStatus();
      } else {
        if (showToast) showToast(res.message || 'Gagal menghapus key.', 'error');
      }
    } catch (e) {
      if (showToast) showToast('Koneksi sistem gagal.', 'error');
    }
  };

  const handleTestKey = async () => {
    setGeminiTesting(true);
    try {
      const keyToTest = geminiApiKey.trim() || null;
      const res = await apiTestGeminiKey(keyToTest);
      if (res.success) {
        if (showToast) showToast(res.message || 'Koneksi Gemini AI Berhasil!', 'success');
        if (geminiApiKey.trim()) {
          fetchKeyStatus();
        }
      } else {
        if (showToast) showToast(res.message || 'Gagal menghubungkan ke Gemini.', 'error');
      }
    } catch (e) {
      if (showToast) showToast('Koneksi tes sistem gagal.', 'error');
    } finally {
      setGeminiTesting(false);
    }
  };

  const handleSendPrompt = async (presetText = null) => {
    const textToSend = presetText || promptInput.trim();
    if (!textToSend || geminiLoading) return;

    const userMessage = {
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })
    };

    setConversation(prev => [...prev, userMessage]);
    if (!presetText) setPromptInput('');
    setGeminiLoading(true);

    const historyPayload = conversation
      .filter(m => !m.isError && m !== initialGreeting)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }));

    try {
      const res = await apiGeminiPrompt({
        prompt: userMessage.text,
        include_context: includeContext,
        conversation_history: historyPayload,
        session_id: activeSessionId
      });
      const replyTime = res.data?.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const replyDate = res.data?.date || new Date().toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
      const replyText = res.data?.reply || res.data?.response || res.reply;

      if (res.success && replyText) {
        // If this was a new session without an activeSessionId, update session state
        if (!activeSessionId && res.data?.session_id) {
          setActiveSessionId(res.data.session_id);
          setActiveSessionTitle(res.data.session_title || userMessage.text.slice(0, 45));
          fetchSessions(false);
        } else {
          // Re-order current active session to top
          setSessions(prev => {
            const idx = prev.findIndex(s => s.session_id === activeSessionId);
            if (idx >= 0) {
              const current = { ...prev[idx], updated_at: new Date().toISOString() };
              const filtered = prev.filter((_, i) => i !== idx);
              return [current, ...filtered];
            }
            return prev;
          });
        }

        setConversation(prev => {
          const updated = [...prev];
          if (res.data?.user_message_id && updated.length >= 1) {
            const lastIdx = updated.length - 1;
            if (updated[lastIdx].role === 'user') {
              updated[lastIdx] = { 
                ...updated[lastIdx], 
                id: res.data.user_message_id, 
                isFromDb: true 
              };
            }
          }
          updated.push({
            id: res.data?.model_message_id,
            role: 'model',
            text: replyText,
            time: replyTime,
            date: replyDate,
            model: res.data?.model_used,
            isFromDb: true
          });
          return updated;
        });
      } else {
        setConversation(prev => [...prev, {
          role: 'model',
          text: res.message || 'Gagal memproses prompt ke Gemini.',
          time: replyTime,
          isError: true
        }]);
      }
    } catch (e) {
      setConversation(prev => [...prev, {
        role: 'model',
        text: 'Terjadi kesalahan jaringan saat memanggil Gemini AI.',
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
      if (showToast) showToast('Jawaban AI disalin ke clipboard!');
    }
  };

  const handleDeleteMessage = async (msgId, index) => {
    if (!msgId) {
      setConversation(prev => prev.filter((_, i) => i !== index));
      return;
    }
    try {
      const res = await apiDeleteGeminiMessage(msgId);
      if (res.success) {
        setConversation(prev => prev.filter(m => m.id !== msgId));
        if (showToast) showToast('Pesan berhasil dihapus dari database.');
      } else {
        if (showToast) showToast(res.message || 'Gagal menghapus pesan.', 'error');
      }
    } catch (e) {
      if (showToast) showToast('Koneksi sistem gagal.', 'error');
    }
  };

  // Filter sessions by search keyword
  const filteredSessions = sessions.filter(s => {
    if (!historySearch.trim()) return true;
    return (s.title || '').toLowerCase().includes(historySearch.toLowerCase());
  });

  // Render sidebar contents (reused in offcanvas drawer for mobile and docked panel for desktop)
  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Drawer Header for Mobile */}
      {isMobile && (
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0 font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-white truncate">Menu Sidebar Riwayat</h3>
              <p className="text-[10px] text-slate-400 truncate">Pilih topik atau obrolan baru</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Tutup Menu Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* New Chat Button */}
      <button
        onClick={handleNewChat}
        className="w-full mb-3 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-bold transition shadow-xs cursor-pointer border border-slate-700/80"
        title="Mulai Sesi Obrolan Baru"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Obrolan Baru</span>
      </button>

      {/* Header: Semua & Filter Icon */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80 px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-200">Semua</span>
          {sessions.length > 0 && (
            <span className="text-[10px] text-slate-400 font-mono">({filteredSessions.length})</span>
          )}
        </div>
        <button
          onClick={() => setShowSearchInput(!showSearchInput)}
          className={`p-1 rounded-lg transition cursor-pointer ${
            showSearchInput ? 'text-blue-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Filter / Cari Riwayat"
        >
          <Filter className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Filter Search Input (Collapsible) */}
      {showSearchInput && (
        <div className="relative mb-2">
          <input
            type="text"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder="Cari topik obrolan..."
            className="w-full text-xs bg-slate-800/90 text-white placeholder-slate-400 rounded-lg pl-7 pr-7 py-1.5 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
          {historySearch && (
            <button
              onClick={() => setHistorySearch('')}
              className="absolute right-2 top-2 text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 text-left">
        {sessionsLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-500 text-xs gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Memuat riwayat...</span>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs px-2">
            {historySearch ? 'Topik tidak ditemukan' : 'Belum ada riwayat percakapan. Mulai percakapan pertama Anda!'}
          </div>
        ) : (
          filteredSessions.map((s) => {
            const isActive = activeSessionId === s.session_id;
            return (
              <div
                key={s.session_id}
                onClick={() => handleSelectSession(s.session_id)}
                className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700/60 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                title={s.title}
              >
                <span className="truncate flex-1 pr-2 text-left">
                  {s.title}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(s.session_id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-400 transition cursor-pointer"
                  title="Hapus topik ini"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="pt-2.5 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span>{sessions.length} sesi tersimpan</span>
        {sessions.length > 0 && (
          <button
            onClick={handleClearAllSessions}
            className="hover:text-rose-400 transition cursor-pointer"
            title="Hapus Semua Riwayat"
          >
            Bersihkan Semua
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)] min-h-[520px] space-y-2.5">
      
      {/* 1. Header Banner (Compact by Default or Expandable) */}
      {!headerCollapsed ? (
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Asisten AI Gemini
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                INTELLIGENT AI
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Konsultasi cerdas analisis risiko arus kas, rekomendasi prioritas penagihan termin, dan draf pesan WhatsApp via Google Gemini AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {hasKey ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/80 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Gemini Siap</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-semibold border border-amber-200/80 dark:border-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Kunci API Diperlukan</span>
              </div>
            )}

            {/* DB Persistent indicator */}
            <div 
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700" 
              title="Setiap obrolan otomatis tersimpan di database"
            >
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>DB Tersimpan</span>
              {sessions.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold">
                  {sessions.length} Sesi
                </span>
              )}
            </div>

            {/* Toggle Hide/Show Key Card Button */}
            <button
              onClick={toggleShowKeyCard}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer ${
                showKeyCard
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              title={showKeyCard ? "Sembunyikan Pengaturan API Key" : "Tampilkan Pengaturan API Key"}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{showKeyCard ? 'Tutup Key' : 'Atur Key'}</span>
              {showKeyCard ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Minimize Banner Button */}
            <button
              onClick={toggleHeaderCollapsed}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Ciutkan Header Banner"
            >
              <span>Ciutkan</span>
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        /* Collapsed / Compact Header Banner */
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
              Asisten AI Gemini
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              INTELLIGENT AI
            </span>
            {hasKey ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="hidden md:inline">Gemini Siap</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span className="hidden md:inline">Kunci API Diperlukan</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleShowKeyCard}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold shadow-2xs transition active:scale-95 cursor-pointer ${
                showKeyCard
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
              title={showKeyCard ? "Sembunyikan Pengaturan API Key" : "Tampilkan Pengaturan API Key"}
            >
              <Key className="w-3 h-3" />
              <span>{showKeyCard ? 'Tutup Key' : 'Atur Key'}</span>
              {showKeyCard ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {conversation.length > 1 && (
              <button
                onClick={handleNewChat}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] transition cursor-pointer"
                title="Mulai Chat Baru"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={toggleHeaderCollapsed}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Perluas Header Banner"
            >
              <span>Perluas</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Gemini API Key Setting Card (Collapsible) */}
      {showKeyCard && (
        <div className="shrink-0 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Pengaturan Google Gemini API Key</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kunci API disimpan secara aman di database sistem untuk fitur asisten finansial cerdas.
              </p>
            </div>
            
            <button
              onClick={toggleShowKeyCard}
              className="self-end sm:self-auto p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              title="Tutup Pengaturan Key"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveKey} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
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
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
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
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition active:scale-95 disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${geminiTesting ? 'animate-spin' : ''}`} />
                  <span>{geminiTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
                </button>

                {hasKey && (
                  <button
                    type="button"
                    onClick={handleDeleteKey}
                    className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-xs transition active:scale-95 cursor-pointer"
                    title="Hapus API Key"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 pt-1 gap-1">
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition underline underline-offset-2"
              >
                <span>Dapatkan API Key gratis di Google AI Studio (aistudio.google.com)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              {savedKeyMasked && (
                <span className="font-mono text-[10px]">Kunci aktif: {savedKeyMasked}</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* 2.5 Mobile Menu Sidebar Drawer (Off-canvas for Mobile & Narrow Screens) */}
      <div 
        onClick={() => setMobileDrawerOpen(false)}
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 lg:hidden transition-opacity duration-300 ${
          mobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      <div className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-slate-900 text-slate-200 dark:bg-slate-950 p-4 flex flex-col shadow-2xl border-r border-slate-800 lg:hidden transition-transform duration-300 ease-in-out ${
        mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {renderSidebarContent(true)}
      </div>

      {/* 3. Main Workspace: Desktop Sidebar (Left) + Chat Console (Right) */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 items-stretch w-full">
        
        {/* Desktop Left Docked Sidebar (Only visible on lg: screens and above) */}
        {desktopSidebarOpen && (
          <aside className="hidden lg:flex w-72 xl:w-80 shrink-0 bg-slate-900 text-slate-200 dark:bg-slate-950 rounded-2xl border border-slate-800/90 p-3.5 flex-col h-full shadow-sm transition-all overflow-hidden">
            {renderSidebarContent(false)}
          </aside>
        )}

        {/* Right Main Chat Console - Takes 100% Full Height */}
        <div className="flex-1 min-h-0 flex flex-col space-y-2 w-full min-w-0 h-full">
          
          {/* Top Bar for Chat Box: Toggle History Menu, Session Title, New Chat */}
          <div className="flex items-center justify-between gap-2 px-1 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              
              {/* Mobile: Opens Off-canvas Menu Sidebar */}
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
                title="Buka Menu Sidebar Riwayat"
              >
                <PanelLeft className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Menu Sidebar</span>
                {sessions.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold">
                    {sessions.length}
                  </span>
                )}
              </button>

              {/* Desktop: Collapses/Expands Left Sidebar */}
              <button
                type="button"
                onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
                className="hidden lg:flex p-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer items-center gap-1.5 text-xs font-semibold shadow-2xs"
                title={desktopSidebarOpen ? "Sembunyikan Sidebar Riwayat" : "Buka Sidebar Riwayat"}
              >
                <PanelLeft className="w-4 h-4 text-blue-500 shrink-0" />
                <span>{desktopSidebarOpen ? 'Tutup Sidebar' : 'Buka Sidebar'}</span>
                {sessions.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                    {sessions.length}
                  </span>
                )}
              </button>

              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[140px] sm:max-w-xs md:max-w-md" title={activeSessionTitle}>
                {activeSessionTitle || 'Obrolan Baru'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNewChat}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-xs cursor-pointer shadow-xs transition active:scale-95 shrink-0"
              title="Mulai Sesi Obrolan Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Obrolan Baru</span>
            </button>
          </div>

          {/* Interactive AI Consultation Full-Height Chat Card */}
          <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
            
            {/* Scrollable Messages Area (Takes 100% of available height) */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-slate-500" />
                  <span className="text-xs font-medium">Memuat pesan percakapan...</span>
                </div>
              ) : (
                conversation.map((msg, index) => {
                  const showDateHeader = msg.date && (index === 1 || (index > 1 && conversation[index - 1]?.date !== msg.date));

                  return (
                    <React.Fragment key={msg.id || index}>
                      {showDateHeader && (
                        <div className="flex items-center justify-center my-3">
                          <span className="px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 shadow-2xs">
                            {msg.date}
                          </span>
                        </div>
                      )}
                      <div 
                        className={`flex gap-3 text-xs ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`p-4 rounded-2xl max-w-2xl relative group ${
                          msg.role === 'user'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-tr-none shadow-xs'
                            : msg.isError
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900 rounded-tl-none'
                            : 'bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none'
                        }`}>
                          <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-black/5 dark:border-white/10">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-slate-200 dark:text-slate-600' : 'text-slate-600 dark:text-slate-400'}`}>
                              {msg.role === 'user' ? (msg.userName ? `Anda (${msg.userName})` : 'Anda') : 'Asisten Keuangan Gemini AI'}
                            </span>
                            <div className="flex items-center gap-2 text-[9px] opacity-75">
                              <span>{msg.time}</span>
                              {msg.role === 'model' && !msg.isError && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(msg.text)}
                                  className="hover:text-blue-500 transition cursor-pointer"
                                  title="Salin Teks"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                              {msg.id && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id, index)}
                                  className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition cursor-pointer"
                                  title="Hapus pesan ini dari database"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="whitespace-pre-wrap leading-relaxed text-xs">
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}

              {geminiLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold p-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-700 dark:text-slate-200" />
                  <span>Gemini sedang berpikir & menganalisis arus kas...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Bottom Pinned Input Area with Floating Pertanyaan Cepat */}
            <div className="shrink-0 p-3 sm:p-3.5 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md relative">
              
              {/* Floating "Pertanyaan Cepat" Trigger & Popover Menu */}
              <div className="relative mb-2" ref={quickPromptsRef}>
                
                {/* Floating Popover Menu (Opens Upward Over Chat) */}
                {showQuickPrompts && (
                  <div className="absolute bottom-full mb-2 left-0 z-30 w-80 sm:w-96 max-w-[92vw] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-700 shadow-2xl p-3 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Rekomendasi Pertanyaan Cepat</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowQuickPrompts(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition cursor-pointer"
                        title="Tutup Menu"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                      {quickPrompts.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          disabled={geminiLoading}
                          onClick={() => {
                            handleSendPrompt(chip);
                            setShowQuickPrompts(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center justify-between group cursor-pointer"
                        >
                          <span className="flex-1 pr-2 leading-relaxed">{chip}</span>
                          <Send className="w-3 h-3 text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Floating Pill Button to Toggle Popover */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowQuickPrompts(!showQuickPrompts)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all active:scale-95 cursor-pointer shadow-xs ${
                      showQuickPrompts
                        ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                    title="Pilih Pertanyaan Cepat Finansial"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Pertanyaan Cepat</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showQuickPrompts ? 'rotate-180' : ''}`} />
                  </button>

                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    Pilih draf instan tanpa perlu mengetik
                  </span>
                </div>
              </div>

              {/* Prompt Input Form */}
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
                    className="w-full text-xs font-medium rounded-xl p-3 pr-24 border bg-white border-slate-200 text-slate-900 dark:bg-slate-900 dark:border-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400 resize-none shadow-2xs"
                  />
                  
                  <button
                    type="submit"
                    disabled={geminiLoading || !promptInput.trim()}
                    className="absolute right-2.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs shadow-xs transition active:scale-95 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
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
                      className="rounded text-slate-900 focus:ring-0 cursor-pointer"
                    />
                    <span>Sertakan data ringkasan proyek & arus kas terkini</span>
                  </label>

                  <span className="hidden sm:inline text-[10px] text-slate-400">
                    Shift + Enter untuk baris baru
                  </span>
                </div>
              </form>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
