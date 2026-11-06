# 📑 DOKUMEN SPESIFIKASI SISTEM & PRD
# ProCash Tracker: Aplikasi Pengingat Kas & Proyek Freelance
> Disiapkan untuk: **Pak Rahmat** & **Tim IT Developer**  
> Versi: **1.0.0 (Production Blueprint)**  
> Tanggal: **November 2026**

---

## 📌 DAFTAR ISI
1. [Ringkasan Eksekutif & Permasalahan](#1-ringkasan-eksekutif--permasalahan)
2. [Product Requirements Document (PRD)](#2-product-requirements-document-prd)
3. [Aturan Bisnis & Logika Perhitungan (Rules)](#3-aturan-bisnis--logika-perhitungan-rules)
4. [Skema Database & Relasi (Schema)](#4-skema-database--relasi-schema)
5. [Arsitektur Sistem & Rekomendasi Stack (Architecture)](#5-arsitektur-sistem--rekomendasi-stack-architecture)
6. [Desain UI/UX & Wireframe Antarmuka (Design)](#6-desain-uiux--wireframe-antarmuka-design)
7. [Petunjuk Implementasi Developer IT (Quickstart Guide)](#7-petunjuk-implementasi-developer-it-quickstart-guide)

---

## 1. Ringkasan Eksekutif & Permasalahan

### 1.1 Problem Statement
Pak Rahmat sering menangani beberapa proyek freelance bernilai jutaan rupiah (contoh riil: **Proyek Jonggol dengan total nilai kontrak Rp 11.000.000**). Dalam prakteknya:
- Klien tidak membayar sekaligus, melainkan bertahap (DP, termin progres, pelunasan).
- Pak Rahmat dibantu oleh tim/subkontraktor (misal desainer, programmer, teknisi) yang juga menerima honor bertahap.
- **Masalah utama:** Kerap kali Pak Rahmat lupa menagih sisa termin ke klien (*piutang mengendap*), atau sebaliknya ragu apakah honor tim sudah lunas atau masih ada sisa hutang.
- Rekan IT Pak Rahmat membutuhkan panduan teknis yang presisi agar sistem tidak sekadar menjadi aplikasi *to-do list*, melainkan **Financial & Reminder Tracking System** yang akurat.

### 1.2 Solusi Produk
Aplikasi **ProCash Tracker** hadir sebagai sistem satu pintu:
1. **Pencatatan Master Proyek:** Mencatat nilai kontrak, klien, dan tenggat waktu.
2. **Pencatatan Arus Masuk (Cash-In Klien):** DP, Termin, Pelunasan.
3. **Pencatatan Arus Keluar (Cash-Out Tim):** Plafon honor tim & realisasi pembayaran.
4. **Kalkulator Kas Otomatis:** Mengukur Piutang, Hutang Tim, Uang Riil di Tangan, dan Estimasi Laba Bersih.
5. **Sistem Pengingat Visual & WhatsApp (Smart Reminder):** Menampilkan warna status (Merah = Tagih Klien, Kuning = Bayar Tim, Hijau = Lunas) serta template pesan penagihan WhatsApp 1-klik.

---

## 2. Product Requirements Document (PRD)

### 2.1 User Stories
- **Sebagai Project Owner (Pak Rahmat):**
  - *Saya ingin* melihat total uang kas riil di tangan saya setiap saat, *agar* saya tidak membelanjakan uang yang sebenarnya adalah hak tim pendukung saya.
  - *Saya ingin* melihat daftar klien yang masih berhutang (piutang > 0) dengan badge merah mencolok, *agar* saya bisa langsung menagih tepat waktu.
  - *Saya ingin* melihat sisa honor tim yang belum saya bayar dengan badge kuning, *agar* kredibilitas saya di depan rekan kerja tetap terjaga.
  - *Saya ingin* sekali klik tombol langsung membuka WhatsApp dengan draft teks penagihan sopan, *agar* penagihan praktis tanpa perlu mengetik ulang dari awal.

### 2.2 Functional Requirements Matrix
| Modul | ID Fitur | Deskripsi Kebutuhan | Prioritas |
|---|---|---|---|
| **Auth** | F-001 | Login aman sederhana bagi pemilik proyek (PIN/Password). | High |
| **Dashboard** | F-002 | Widget ringkasan finansial (Total Kas Bersih, Total Piutang, Total Hutang Tim). | Critical |
| **Dashboard** | F-003 | Filter proyek berdasarkan status warna (Semua, Merah/Perlu Ditagih, Kuning/Perlu Dibayar, Hijau/Lunas). | High |
| **Proyek** | F-004 | Tambah, Edit, Detail, dan Arsipkan Proyek. | Critical |
| **Pemasukan** | F-005 | Form pencatatan termin klien (DP, Termin, Pelunasan) dengan tanggal dan metode bayar. | Critical |
| **Pengeluaran** | F-006 | Alokasi anggota tim + komitmen honor proyek. | Critical |
| **Pengeluaran** | F-007 | Pencatatan pembayaran cicilan/pelunasan honor ke anggota tim. | Critical |
| **Reminder** | F-008 | Action button WhatsApp penagihan dengan format pesan otomatis. | Medium |
| **Laporan** | F-009 | Cetak/Export Rekap Proyek (Invoice & Lembar Kas Proyek format PDF). | Medium |

---

## 3. Aturan Bisnis & Logika Perhitungan (Rules)

### 3.1 Formula Finansial Baku
Setiap kali ada input pembayaran masuk atau keluar, sistem secara reaktif menghitung:

1. **Sisa Tagihan Klien (Piutang):**
   $$\text{Piutang} = \text{Total Nilai Kontrak} - \sum(\text{Jumlah Dibayar Klien})$$
2. **Sisa Tanggungan Honor Tim (Hutang Tim):**
   $$\text{Hutang Tim} = \sum(\text{Plafon Honor Tim}) - \sum(\text{Sudah Dibayar ke Tim})$$
3. **Uang Riil di Tangan (Kas Bersih Proyek):**
   $$\text{Kas Bersih} = \sum(\text{Jumlah Dibayar Klien}) - \sum(\text{Sudah Dibayar ke Tim})$$
4. **Proyeksi Laba Bersih (Net Profit):**
   $$\text{Proyeksi Laba} = \text{Total Nilai Kontrak} - \sum(\text{Plafon Honor Tim})$$
5. **Margin Profit (%):**
   $$\text{Margin (\%)} = \left(\frac{\text{Proyeksi Laba}}{\text{Total Nilai Kontrak}}\right) \times 100$$

### 3.2 Matrix Indikator & Trigger Warna
Sistem wajib mengevaluasi status visual tiap kartu proyek:
- 🔴 **MERAH (`TAGIH_KLIEN`):** Jika $\text{Piutang} > 0$.
- 🟡 **KUNING (`BAYAR_TIM`):** Jika $\text{Hutang Tim} > 0$.
- 🟢 **HIJAU (`LUNAS_SELESAI`):** Jika $\text{Piutang} \le 0$ **DAN** $\text{Hutang Tim} \le 0$.
- 🟣 **UNGU (`ALERT_DEFISIT`):** Jika $\text{Kas Bersih} < 0$ (artinya Pak Rahmat menalangi honor tim sebelum uang klien masuk).

---

## 4. Skema Database & Relasi (Schema)

File DDL lengkap telah disediakan di [`database/schema.sql`](file:///c:/xampp/htdocs/ASLI/Projectk2/database/schema.sql).

### 4.1 Tabel-tabel Utama:
1. `projects`: Menyimpan identitas proyek, nama klien, kontak, nilai kontrak, dan deadline.
2. `client_payments`: Menyimpan tiap termin pembayaran masuk dari klien.
3. `project_team_members`: Menyimpan daftar tim pendukung per proyek beserta komitmen plafon honornya.
4. `team_payments`: Menyimpan riwayat pencairan uang ke masing-masing anggota tim.
5. `v_project_financial_summary`: **MySQL View** yang otomatis menyatukan agregasi SUM dan menghitung Piutang, Hutang, Kas Bersih, Margin, serta Status Badge secara real-time tanpa perlu query berulang di kode aplikasi.

---

## 5. Arsitektur Sistem & Rekomendasi Stack (Architecture)

### 5.1 Environment Target
Aplikasi disiapkan untuk berjalan di lingkungan **XAMPP Windows**:
- **Backend:** PHP 8.2+ (bisa menggunakan Laravel 11 atau Native MVC Modern).
- **Database:** MariaDB / MySQL 8.0 bawaan XAMPP.
- **Frontend:** HTML5 + Tailwind CSS (via CDN atau Vite) + Alpine.js (reaktif ringan tanpa kerumitan build tools).
- **Koneksi:** PDO MySQL dengan *Prepared Statements*.

### 5.2 Flow Data
```
[User Input Modal] 
       │
       ▼
[Controller / Endpoint] 
       │ (Validasi & Sanitasi)
       ▼
[MySQL Tables: client_payments / team_payments]
       │
       ▼
[Database View: v_project_financial_summary] 
       │ (Auto-calculate Agregat)
       ▼
[Dashboard UI: Update KPI Cards & Status Badge]
```

---

## 6. Desain UI/UX & Wireframe Antarmuka (Design)

### 6.1 Layout Dashboard Eksekutif
```
┌────────────────────────────────────────────────────────────────────────┐
│  ProCash Tracker                       [ + Buat Proyek Baru ]          │
├────────────────────────────────────────────────────────────────────────┤
│  RINGKASAN TOTAL ARUS KAS                                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐        │
│  │ KAS BERSIH       │ │ TOTAL PIUTANG    │ │ TOTAL HUTANG TIM │        │
│  │ Rp 1.750.000     │ │ Rp 8.250.000     │ │ Rp 2.000.000     │        │
│  │ (Uang aman)      │ │ 🔴 Perlu ditagih │ │ 🟡 Hak tim       │        │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘        │
├────────────────────────────────────────────────────────────────────────┤
│  DAFTAR PROYEK                                  [ Filter: Semua | 🔴 ] │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Proyek Jonggol (PT Mitra Perkasa)          [🔴 TAGIH] [🟡 TIM]   │  │
│  │ Nilai Kontrak : Rp 11.000.000                                    │  │
│  │ ──────────────────────────────────────────────────────────────── │  │
│  │ • Pemasukan Klien : Rp 2.750.000 (Sisa Piutang: Rp 8.250.000)    │  │
│  │ • Honor Tim       : Rp 1.000.000 (Sisa Hutang : Rp 2.000.000)    │  │
│  │ • Kas Bersih      : Rp 1.750.000 (Margin Laba : 72.7%)           │  │
│  │ ──────────────────────────────────────────────────────────────── │  │
│  │ [ + Catat Bayar Klien ]  [ + Bayar Tim ]  [ 📲 WhatsApp ]  [...] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Petunjuk Implementasi Developer IT (Quickstart Guide)

Rekan IT dapat langsung memulai pengembangan dengan langkah berikut:
1. **Import Database:**
   - Buka `http://localhost/phpmyadmin`.
   - Buat database `procash_tracker`.
   - Import file [`database/schema.sql`](file:///c:/xampp/htdocs/ASLI/Projectk2/database/schema.sql).
2. **Kueri Data:**
   - Gunakan `SELECT * FROM v_project_financial_summary;` untuk langsung mendapatkan seluruh perhitungan tanpa rumus manual di PHP.
3. **Trigger WhatsApp Otomatis:**
   Gunakan URL format:
   `https://wa.me/{nomor_klien}?text={teks_encoded}`
