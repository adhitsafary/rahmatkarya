import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  Plus, 
  Settings2, 
  Trash2, 
  RotateCcw, 
  Save, 
  ChevronDown, 
  Sparkles 
} from 'lucide-react';
import { formatRupiah } from '../../utils/format';

const STORAGE_KEY = 'procash_wa_templates_v2';
const LAST_TPL_KEY = 'procash_wa_last_template_id';

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl_tagihan',
    name: 'Tagihan & No. Rekening (Bawaan)',
    isDefault: true,
    content: `Halo Bapak/Ibu {klien},\n\nSemoga sehat dan sukses selalu. Kami ingin mengonfirmasi mengenai kelanjutan administrasi untuk *{proyek}*.\n\nBerdasarkan catatan rekapitulasi kami, sisa tagihan yang masih terbuka adalah sebesar *{tagihan}*.\n\nBerikut kami lampirkan nomor rekening untuk kemudahan pembayaran:\n{rekening}\n\nMohon konfirmasinya jika pembayaran telah disalurkan. Terima kasih banyak atas kerjasamanya!`
  },
  {
    id: 'tpl_jatuh_tempo',
    name: 'Pengingat Jatuh Tempo / Termin',
    isDefault: true,
    content: `Halo Bapak/Ibu {klien},\n\nMengingatkan kembali perihal tagihan termin untuk proyek *{proyek}* sebesar *{tagihan}*.\n\nPembayaran dapat disalurkan ke rekening resmi kami:\n{rekening}\n\nJika ada kendala atau pertanyaan mengenai rincian proyek, silakan hubungi kami. Terima kasih atas kerjasamanya!`
  },
  {
    id: 'tpl_progres',
    name: 'Update Progres & Administrasi',
    isDefault: true,
    content: `Halo Bapak/Ibu {klien},\n\nBerikut update progres untuk pekerjaan *{proyek}*. Saat ini pekerjaan sedang berjalan sesuai jadwal.\n\nUntuk kelancaran tahapan berikutnya, kami informasikan catatan piutang/administrasi saat ini adalah *{tagihan}* dari total nilai kontrak *{kontrak}*.\n\nTerima kasih banyak atas dukungan dan kerjasamanya!`
  },
  {
    id: 'tpl_lunas',
    name: 'Konfirmasi Pelunasan & Terima Kasih',
    isDefault: true,
    content: `Halo Bapak/Ibu {klien},\n\nTerima kasih banyak! Pembayaran untuk proyek *{proyek}* telah kami terima dengan baik dan tercatat LUNAS di sistem buku kas kami.\n\nSenang dapat bekerjasama dengan Bapak/Ibu. Sukses selalu untuk usahanya!`
  }
];

// Helper to replace placeholder tags with actual project values
function compileTemplate(content, project, appSettings = null) {
  if (!content) return '';
  const clientName = project?.client_name || 'Klien';
  const projectName = project?.project_name || 'Proyek';
  const receivable = project?.client_receivable_remaining != null ? formatRupiah(project.client_receivable_remaining) : 'Rp 0';
  const contract = project?.total_contract_value != null ? formatRupiah(project.total_contract_value) : 'Rp 0';
  const paid = project?.total_paid_by_client != null ? formatRupiah(project.total_paid_by_client) : 'Rp 0';

  const bankName = appSettings?.default_bank_name || 'Bank BCA';
  const bankNo = appSettings?.default_bank_account_number || '123-456-7890';
  const bankHolder = appSettings?.default_bank_account_holder || 'Tim Manajemen Keuangan';
  const rekening = `${bankName}: ${bankNo} a.n ${bankHolder}`;
  const spk = project?.contract_number || project?.project_code || '-';

  return content
    .replace(/{klien}/gi, clientName)
    .replace(/{nama_klien}/gi, clientName)
    .replace(/{proyek}/gi, projectName)
    .replace(/{nama_proyek}/gi, projectName)
    .replace(/{tagihan}/gi, receivable)
    .replace(/{sisa_tagihan}/gi, receivable)
    .replace(/{kontrak}/gi, contract)
    .replace(/{nilai_kontrak}/gi, contract)
    .replace(/{termin_masuk}/gi, paid)
    .replace(/{rekening}/gi, rekening)
    .replace(/{no_rekening}/gi, rekening)
    .replace(/{spk}/gi, spk);
}

// WhatsApp official brand SVG
const WhatsAppIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function FilamentWhatsAppModal({ isOpen, project, onClose, showToast, appSettings }) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Template Management States
  const [templates, setTemplates] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_TEMPLATES;
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState(() => {
    return localStorage.getItem(LAST_TPL_KEY) || 'tpl_tagihan';
  });

  // Editor Drawer state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null); // null means adding new
  const [editorName, setEditorName] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const editorTextareaRef = useRef(null);

  // Sync templates to localStorage
  const saveTemplatesToStorage = (updatedList) => {
    setTemplates(updatedList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    } catch {
      // ignore
    }
  };

  // Re-generate message whenever modal opens, project changes, or selected template changes
  useEffect(() => {
    if (isOpen && project) {
      setPhone(project.client_phone || '');
      setIsEditorOpen(false);

      // Find current active template
      const currentTpl = templates.find(t => t.id === selectedTemplateId) || templates[0] || DEFAULT_TEMPLATES[0];
      if (currentTpl) {
        setSelectedTemplateId(currentTpl.id);
        setMessage(compileTemplate(currentTpl.content, project, appSettings));
      }
      setCopied(false);
    }
  }, [isOpen, project, selectedTemplateId, templates, appSettings]);

  if (!isOpen || !project) return null;

  // Handle switching template from select dropdown
  const handleSelectTemplate = (id) => {
    setSelectedTemplateId(id);
    localStorage.setItem(LAST_TPL_KEY, id);
    const chosen = templates.find(t => t.id === id);
    if (chosen) {
      setMessage(compileTemplate(chosen.content, project, appSettings));
      if (showToast) showToast(`Template dialihkan: ${chosen.name}`);
    }
  };

  // Open editor to edit the currently selected template
  const handleOpenEditCurrent = () => {
    const chosen = templates.find(t => t.id === selectedTemplateId) || templates[0];
    if (chosen) {
      setEditingTemplateId(chosen.id);
      setEditorName(chosen.name);
      setEditorContent(chosen.content);
      setIsEditorOpen(true);
    }
  };

  // Open editor to create a new template from scratch or current message
  const handleOpenCreateNew = (initialText = '') => {
    setEditingTemplateId(null);
    setEditorName(`Template Kustom ${templates.length + 1}`);
    setEditorContent(initialText || `Halo Bapak/Ibu {klien},\n\n[Tulis pesan Anda di sini perihal proyek *{proyek}*].\nSisa tagihan: *{tagihan}*.\n\nTerima kasih!`);
    setIsEditorOpen(true);
  };

  // Insert variable tag into the template editor textarea
  const handleInsertTag = (tag) => {
    if (!editorTextareaRef.current) {
      setEditorContent(prev => prev + ' ' + tag);
      return;
    }
    const el = editorTextareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const nextText = editorContent.substring(0, start) + tag + editorContent.substring(end);
    setEditorContent(nextText);

    // Restore cursor position after inserted tag
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  // Save template (add or update)
  const handleSaveTemplate = (e) => {
    e?.preventDefault();
    if (!editorName.trim()) {
      if (showToast) showToast('Nama template tidak boleh kosong!', 'warning');
      return;
    }
    if (!editorContent.trim()) {
      if (showToast) showToast('Isi format template tidak boleh kosong!', 'warning');
      return;
    }

    if (editingTemplateId) {
      // Update existing
      const updated = templates.map(t => {
        if (t.id === editingTemplateId) {
          return { ...t, name: editorName.trim(), content: editorContent };
        }
        return t;
      });
      saveTemplatesToStorage(updated);
      setSelectedTemplateId(editingTemplateId);
      setMessage(compileTemplate(editorContent, project, appSettings));
      if (showToast) showToast(`Template "${editorName.trim()}" berhasil diperbarui!`);
    } else {
      // Create new
      const newId = 'tpl_custom_' + Date.now();
      const newTpl = {
        id: newId,
        name: editorName.trim(),
        isDefault: false,
        content: editorContent
      };
      const updated = [...templates, newTpl];
      saveTemplatesToStorage(updated);
      setSelectedTemplateId(newId);
      localStorage.setItem(LAST_TPL_KEY, newId);
      setMessage(compileTemplate(editorContent, project, appSettings));
      if (showToast) showToast(`Template baru "${editorName.trim()}" berhasil disimpan!`);
    }

    setIsEditorOpen(false);
  };

  // Delete custom template
  const handleDeleteTemplate = (idToDelete) => {
    const tplToDelete = templates.find(t => t.id === idToDelete);
    if (tplToDelete?.isDefault) {
      if (showToast) showToast('Template bawaan sistem tidak dapat dihapus!', 'warning');
      return;
    }
    if (!window.confirm(`Yakin ingin menghapus template "${tplToDelete?.name}"?`)) {
      return;
    }

    const updated = templates.filter(t => t.id !== idToDelete);
    saveTemplatesToStorage(updated);

    const fallbackId = updated[0]?.id || 'tpl_tagihan';
    setSelectedTemplateId(fallbackId);
    localStorage.setItem(LAST_TPL_KEY, fallbackId);
    const chosen = updated.find(t => t.id === fallbackId);
    if (chosen) setMessage(compileTemplate(chosen.content, project, appSettings));

    setIsEditorOpen(false);
    if (showToast) showToast(`Template "${tplToDelete?.name}" telah dihapus.`);
  };

  // Reset all templates to default
  const handleResetToDefault = () => {
    if (!window.confirm('Kembalikan semua daftar template ke pilihan standar bawaan sistem? Template kustom Anda akan direset.')) {
      return;
    }
    saveTemplatesToStorage(DEFAULT_TEMPLATES);
    setSelectedTemplateId(DEFAULT_TEMPLATES[0].id);
    localStorage.setItem(LAST_TPL_KEY, DEFAULT_TEMPLATES[0].id);
    setMessage(compileTemplate(DEFAULT_TEMPLATES[0].content, project, appSettings));
    setIsEditorOpen(false);
    if (showToast) showToast('Template WhatsApp berhasil direset ke bawaan sistem.');
  };

  const handleSendWA = () => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    if (!clean) {
      if (showToast) showToast('Nomor WhatsApp klien belum diisi!', 'warning');
      return;
    }
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    if (showToast) showToast('Teks pesan WhatsApp disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <WhatsAppIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Kirim Reminder WhatsApp
              </h3>
              <p className="text-[11px] text-slate-400">
                Kustomisasi template tagihan & notifikasi otomatis
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nomor WhatsApp Tujuan */}
        <div className="space-y-3.5 text-xs font-medium">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Nomor WhatsApp Tujuan
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08123456789 atau 628123456789"
              className="w-full rounded-xl px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Section: Template Selector & Management */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                Pilih Template Pesan
              </label>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleOpenEditCurrent}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition shadow-2xs cursor-pointer"
                  title="Edit format template yang dipilih"
                >
                  <Settings2 className="w-3 h-3 text-slate-500" />
                  <span>Edit Format</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenCreateNew()}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-2xs cursor-pointer"
                  title="Buat template baru"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Template Baru</span>
                </button>
              </div>
            </div>

            {/* Template Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full appearance-none rounded-xl pl-3.5 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer shadow-2xs"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} {!t.isDefault ? '★ (Kustom)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Template Editor Drawer (Active when editing or creating) */}
          {isEditorOpen && (
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/80 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200/50 dark:border-amber-800/50">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{editingTemplateId ? 'Kustomisasi Template Terpilih' : 'Buat Template Baru'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="text-amber-600 hover:text-amber-800 text-[11px] font-bold"
                >
                  Tutup Editor
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Template
                </label>
                <input
                  type="text"
                  value={editorName}
                  onChange={(e) => setEditorName(e.target.value)}
                  placeholder="Contoh: Tagihan DP 50%, Ucapan Terima Kasih, dll"
                  className="w-full rounded-xl px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs"
                />
              </div>

              {/* Tag Quick Inserters */}
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Klik tag untuk menyisipkan variabel dinamis:
                </span>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  {[
                    { tag: '{klien}', label: 'Nama Klien' },
                    { tag: '{proyek}', label: 'Nama Proyek' },
                    { tag: '{tagihan}', label: 'Sisa Tagihan' },
                    { tag: '{kontrak}', label: 'Nilai Kontrak' },
                    { tag: '{rekening}', label: 'No. Rekening' },
                    { tag: '{spk}', label: 'No. SPK' }
                  ].map(v => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => handleInsertTag(v.tag)}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold shadow-2xs transition active:scale-95"
                      title={`Sisipkan ${v.label}`}
                    >
                      +{v.tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template Content */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Format Isi Template
                </label>
                <textarea
                  ref={editorTextareaRef}
                  rows="6"
                  value={editorContent}
                  onChange={(e) => setEditorContent(e.target.value)}
                  className="w-full rounded-xl p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-[11px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Editor Buttons */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  {editingTemplateId && !currentTemplate?.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(editingTemplateId)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold transition shadow-2xs"
                      title="Hapus template kustom ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetToDefault}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[11px] font-bold hover:underline"
                    title="Reset semua template ke standar bawaan sistem"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Bawaan</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTemplate}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Template</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Draft Message (Compiled & Live Editable) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Draft Pesan Siap Kirim (Bisa Diedit Langsung)
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenCreateNew(message)}
                  className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
                  title="Simpan draft pesan saat ini menjadi template baru"
                >
                  <Plus className="w-3 h-3" />
                  <span>Simpan sbg Template Baru</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
                </button>
              </div>
            </div>

            <textarea
              rows="7"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tulis atau sesuaikan pesan pengingat WhatsApp di sini..."
              className="w-full rounded-xl p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-sans text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">
              Template aktif: <strong className="text-slate-600 dark:text-slate-300">{currentTemplate?.name}</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSendWA}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold shadow-md shadow-emerald-600/25 flex items-center gap-2 transition cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4" />
                <span>Buka WhatsApp Web / App</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}