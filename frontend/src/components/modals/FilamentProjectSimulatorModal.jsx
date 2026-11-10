import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calculator, 
  Check, 
  Copy, 
  Plus
} from 'lucide-react';
import { formatRupiah } from '../../utils/format';

export default function FilamentProjectSimulatorModal({
  isOpen,
  onClose,
  onApplyToNewProject,
  showToast
}) {
  const [contractValue, setContractValue] = useState(15000000);
  const [dpPercent, setDpPercent] = useState(25); // Default 25% case Jonggol
  const [subkonPercent, setSubkonPercent] = useState(30); // 30% honor tim
  const [bufferPercent, setBufferPercent] = useState(10); // 10% cadangan operasional
  const [copied, setCopied] = useState(false);

  // Preset SPK Values
  const PRESET_VALUES = [
    { label: '5 Jt', value: 5000000 },
    { label: '10 Jt', value: 10000000 },
    { label: '15 Jt', value: 15000000 },
    { label: '25 Jt', value: 25000000 },
    { label: '50 Jt', value: 50000000 }
  ];

  // Calculated figures
  const calc = useMemo(() => {
    const total = parseFloat(contractValue) || 0;
    const dpAmount = Math.round(total * (dpPercent / 100));
    const subkonAmount = Math.round(total * (subkonPercent / 100));
    const bufferAmount = Math.round(total * (bufferPercent / 100));
    const netProfit = total - subkonAmount - bufferAmount;
    const netProfitPercent = total > 0 ? Math.round((netProfit / total) * 100) : 0;

    // 3 Recommended Termin Breakdown
    // Termin 1: DP
    // Termin 2: Remaining mid progress (e.g. 50% of remaining or fixed)
    const remainingAfterDp = total - dpAmount;
    const termin2Amount = Math.round(remainingAfterDp / 2);
    const termin3Amount = total - dpAmount - termin2Amount;

    return {
      total,
      dpAmount,
      subkonAmount,
      bufferAmount,
      netProfit,
      netProfitPercent,
      termin1: dpAmount,
      termin2: termin2Amount,
      termin3: termin3Amount
    };
  }, [contractValue, dpPercent, subkonPercent, bufferPercent]);

  if (!isOpen) return null;

  // Copy professional WhatsApp proposal text
  const handleCopyProposal = () => {
    const text = `*ESTIMASI STRUKTUR TERMIN & SPK PROYEK*
---------------------------------------
Total Nilai Kontrak : ${formatRupiah(calc.total)}

*Jadwal Termin Pembayaran:*
1. *Termin 1 (DP Awal ${dpPercent}%)* : ${formatRupiah(calc.termin1)}
   (Dibayarkan saat penandatanganan SPK / mulai pengerjaan)
2. *Termin 2 (Progres Fisik 50%)* : ${formatRupiah(calc.termin2)}
   (Dibayarkan saat demonstrasi fitur utama)
3. *Termin 3 (Pelunasan 100%)* : ${formatRupiah(calc.termin3)}
   (Dibayarkan setelah kuota revisi deal disetujui & serah terima)

*Ketentuan Revisi:*
- Termasuk kuota revisi mayor hingga 3x
- Setelah deal revisi disetujui, masuk ke tahapan pelunasan akhir

---------------------------------------
_Dihitung otomatis oleh Rahmat-Karya ProCash System_`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    if (showToast) showToast('Draf penawaran termin berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleApply = () => {
    if (onApplyToNewProject) {
      onApplyToNewProject({
        total_contract_value: calc.total,
        dp_amount: calc.dpAmount,
        subkon_amount: calc.subkonAmount
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-4 sm:p-6 space-y-4 my-auto transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                KALKULATOR SIMULASI SPK & TERMIN
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Hitung struktur kas, termin uang riil, dan margin profit aman
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form Fields */}
        <div className="space-y-4">
          
          {/* 1. Nilai Kontrak SPK */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>NILAI TOTAL KONTRAK SPK</span>
              <span className="font-mono text-blue-600 dark:text-blue-400 font-black">
                {formatRupiah(calc.total)}
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="500000"
                value={contractValue}
                onChange={(e) => setContractValue(Number(e.target.value))}
                className="w-full text-xs font-mono font-bold rounded-xl pl-10 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Quick Value Presets */}
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
              {PRESET_VALUES.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setContractValue(preset.value)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer ${
                    contractValue === preset.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. DP Percentage Selector (Case Jonggol 25% or 50%) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>SKEMA UANG MUKA (DP AWAL)</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {dpPercent}% &bull; {formatRupiah(calc.dpAmount)}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: '25% (Jonggol)', val: 25 },
                { label: '30% (Standard)', val: 30 },
                { label: '40%', val: 40 },
                { label: '50% (Besar)', val: 50 }
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setDpPercent(item.val)}
                  className={`py-1.5 px-2 rounded-xl text-[10px] font-bold transition text-center cursor-pointer border ${
                    dpPercent === item.val
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Slider Subkon & Cadangan Operasional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            
            {/* Subkon Slider */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-600 dark:text-slate-400">Plafon Tim Subkon</span>
                <span className="font-mono text-amber-600 dark:text-amber-400">{subkonPercent}% ({formatRupiah(calc.subkonAmount)})</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                step="5"
                value={subkonPercent}
                onChange={(e) => setSubkonPercent(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
            </div>

            {/* Cadangan Operasional Slider */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-600 dark:text-slate-400">Cadangan Risiko</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{bufferPercent}% ({formatRupiah(calc.bufferAmount)})</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="5"
                value={bufferPercent}
                onChange={(e) => setBufferPercent(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
            </div>

          </div>

        </div>

        {/* Real-time Calculation Result Box */}
        <div className="rounded-2xl bg-slate-900 text-white p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              HASIL PROYEKSI FINANSIAL
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Laba Bersih: {calc.netProfitPercent}%
            </span>
          </div>

          <div className="flex items-baseline justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs text-slate-400 block">Estimasi Keuntungan Bersih:</span>
              <span className="text-2xl font-black font-mono text-emerald-400">
                {formatRupiah(calc.netProfit)}
              </span>
            </div>
            <div className="text-right text-xs font-mono text-slate-400">
              <div>DP Masuk Awal: <strong className="text-white">{formatRupiah(calc.dpAmount)}</strong></div>
              <div>Hak Subkon: <strong className="text-amber-400">{formatRupiah(calc.subkonAmount)}</strong></div>
            </div>
          </div>

          {/* 3 Scheduled Payments Preview */}
          <div className="space-y-1 text-xs font-mono">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Jadwal 3 Termin Disarankan:
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-slate-400 block text-[9px]">Termin 1 (DP)</span>
                <strong className="text-emerald-400 font-bold block mt-0.5">{formatRupiah(calc.termin1)}</strong>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-slate-400 block text-[9px]">Termin 2 (50%)</span>
                <strong className="text-blue-400 font-bold block mt-0.5">{formatRupiah(calc.termin2)}</strong>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-slate-400 block text-[9px]">Termin 3 (Lunas)</span>
                <strong className="text-rose-400 font-bold block mt-0.5">{formatRupiah(calc.termin3)}</strong>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={handleCopyProposal}
            className="w-full sm:w-auto py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Tersalin!' : 'Salin Penawaran WA'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-white transition cursor-pointer font-semibold"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex-1 sm:flex-none py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Terapkan ke Proyek Baru</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
