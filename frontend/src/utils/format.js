// =====================================================================
// FORMATTING HELPERS: Indonesian Rupiah, Dates & Monograms
// =====================================================================

export function formatRupiah(amount) {
  const num = parseFloat(amount) || 0;
  return 'Rp ' + num.toLocaleString('id-ID');
}

// Format numbers with Indonesian thousands dots as user types: "15000000" -> "15.000.000"
export function formatNumberWithDots(val) {
  if (val === undefined || val === null || val === '') return '';
  const clean = val.toString().replace(/\D/g, '');
  if (!clean) return '';
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Parse dotted string back into raw digits for backend APIs: "15.000.000" -> "15000000"
export function parseNumberFromDots(val) {
  if (val === undefined || val === null || val === '') return '';
  return val.toString().replace(/\D/g, '');
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WIB';
}

export function getInitials(name) {
  if (!name) return 'PR';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function calcPercent(part, total) {
  const p = parseFloat(part) || 0;
  const t = parseFloat(total) || 0;
  if (t <= 0) return 0;
  const pct = Math.round((p / t) * 100);
  return Math.min(100, Math.max(0, pct));
}
