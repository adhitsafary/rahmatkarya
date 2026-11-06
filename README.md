# ⚡ Rahmat Karya - ProCash Tracker (Freelance & Cashflow Reminder)
> Sistem Manajemen & Pengingat Arus Kas Proyek Freelance (Dirancang untuk Pak Rahmat & Tim IT).
> Dilengkapi Dual Dashboard (Admin & Client) yang diselaraskan dengan Alur Kontrak, Termin Manual, & Kuota Revisi.

---

## 🚀 Akses Cepat di Browser
Aplikasi ini sudah aktif dan terhubung ke MySQL XAMPP Anda:
- **Dashboard Admin:** [http://localhost/ASLI/Projectk2/index.php](http://localhost/ASLI/Projectk2/index.php)
- **Dashboard Client (Portal Klien Transparan):** [http://localhost/ASLI/Projectk2/client.php?id=1](http://localhost/ASLI/Projectk2/client.php?id=1)
- **Portal Klien via Token:** [http://localhost/ASLI/Projectk2/client.php?token=client-jonggol-2026](http://localhost/ASLI/Projectk2/client.php?token=client-jonggol-2026)
- **Cetak / PDF Rekap & Invoice Proyek Jonggol:** [http://localhost/ASLI/Projectk2/export.php?id=1](http://localhost/ASLI/Projectk2/export.php?id=1)
- **Login Autentikasi:** [http://localhost/ASLI/Projectk2/login.php](http://localhost/ASLI/Projectk2/login.php)
  - 👑 **Admin:** `admin` / `admin123`
  - 💼 **Finance:** `finance` / `password123`
  - 🌐 **Client:** `client` / `client123`

---

## 📊 Keselarasan Alur Flowchart Sistem

```
                         [ Web ]
                        /       \
             [ dashboard client ]  [ dashboard admin ]
                     |                     |
         [ 2. Dashboard client ]         [ 1. ]
         - Menampilkan project           - NO kontrak
         - DP                            - Tgl kontrak
         - Harga                         a. Nama Project (detail project)
         - Tanggal mulai - akhir         b. Nama Client
         - Sistem pembayaran             c. Total tagihan proyek
         - Revisi                        d. DP Awal
         - Progres (Ada chart)           e. Durasi pekerjaan awal - akhir (deadline)
         - PDF dan Auto kirim ke         f. Sistem pembayaran input manual (case jonggol dp 25%, 50% DP. 
           WA dan email                     Buat jadi uang jangan persentase)
                                         g. Revisi ($max: Revisi mayor = 3-5x)
                                                   |
                                                   v
                                         [ Revisi sampai dengan deal / maximal revisi ]
                                                   |
                                                   v
                                         [ Pembayaran akhir ]
                                                   |
                                                   v
                                                [ Done ]
```

---

## 📁 Struktur Berkas Terkini

```
Projectk2/
├── config/
│   └── db.php                  # Koneksi database MySQL PDO
├── database/
│   └── schema.sql              # Skema tabel (projects, payment_terms, revisions, client_payments, team)
├── docs/
│   └── PRD_AND_SYSTEM_DESIGN.md # Dokumen Spesifikasi PRD, Aturan Bisnis, Arsitektur, & Desain
├── api.php                     # REST API Backend (Summary, Projects, Payment Terms, Revisions, Client Portal)
├── client.php                  # Dashboard Client (Portal Transparan Klien + Charts + Auto WA & Email)
├── export.php                  # Halaman cetak / export PDF resmi rekap proyek & termin
├── index.php                   # Frontend Dashboard Admin Interaktif (Tailwind CSS + Alpine.js)
├── login.php                   # Halaman masuk sistem (Admin, Finance, Client)
├── migrate.php                 # Skrip migrasi & reset database cepat
└── README.md                   # Petunjuk penggunaan
```

---

## 🎨 Design System: Modern Fintech & Linear Minimalist SaaS
Redesain sistem ini menerapkan prinsip antarmuka berstandar internasional terinspirasi oleh **Stripe Dashboard**, **Linear.app**, dan arsitektur mobile native **Modern Android Fintech**:
1. **Color Palette & Light Mode Panel:**
   - **Background:** Subtle off-white (`#F8FAFC`).
   - **Card Containers:** Pure white (`#FFFFFF`) dengan border presisi 1px (`#E2E8F0`) dan *soft multi-layered ambient shadow*.
   - **Typography & CTA:** Deep charcoal (`#0F172A`) untuk heading, angka, dan tombol aksi utama.
   - **Muted Pastel Color Accents:** Aksen segar dan tidak monoton untuk status badge dan ikon:
     - 🟢 **Emerald Pastel (`#059669`):** Kas masuk riil, saldo likuid aman, deal revisi disetujui, proyek tuntas.
     - 🔵 **Blue Pastel (`#2563EB`):** Tahapan kontrak & pengerjaan, nilai portofolio, navigasi utama.
     - 🟡 **Amber Pastel (`#D97706`):** Hak tim tertunda, kuota revisi aktif, plafon honor.
     - 🟣 **Indigo Pastel (`#4F46E5`):** AI Cashflow Sentinel, analisis prediktif, pembayaran akhir.
     - 🔴 **Rose Pastel (`#E11D48`):** Sisa piutang klien di luar, peringatan jatuh tempo, anomali kas.
     - 🔷 **Cyan Pastel (`#0891B2`):** Dashboard client portal shortcut, timeline durasi kalender.
2. **Unified Hero Card (Digital Wallet Vault):**
   - Kartu saldo digital master dengan tipografi mono besar, toggle privasi mata (`👁️`), kalkulator kas bersih otomatis, dan deretan tombol aksi cepat (*quick action bar*).
   - Pita 4-metrik terintegrasi langsung di dalam kartu hero (*Piutang Klien, Hak Tim, Kas Masuk, dan Nilai Kontrak*).
   - Strip AI Sentinel terintegrasi pada bagian dasar hero card.
3. **Pill Segmented Tabs (Apple / Material 3 Style):**
   - Kontrol navigasi ergonomis berbasis pil (`Semua Proyek`, `Perlu Ditagih`, `Hak Tim`, `Lunas`) dengan counter badge.
   - Segmented toggle pendamping untuk beralih antara tampilan **Cards (Mobile-First)** dan **List (Spreadsheet)**.
4. **Mobile-First Responsive Card View (Android Developer Standard):**
   - Tata letak kartu responsif dengan target sentuh $\ge 44\text{px}$ untuk kenyamanan jempol di perangkat mobile.
   - Menampilkan monogram avatar, no. kontrak, pil tahapan alur (*workflow step*), kuota revisi mayor, mikro-grid finansial 3 kolom, dual progress bar, dan bilah aksi cepat.

---

## 🧮 Rumus Logika Keuangan yang Digunakan

1. **Sisa Tagihan Klien (Piutang):**
   $$\text{Piutang} = \text{Total Nilai Kontrak} - \sum(\text{Pemasukan Klien})$$
2. **Sisa Hak Tim (Hutang Tim):**
   $$\text{Hutang Tim} = \sum(\text{Plafon Honor Tim}) - \sum(\text{Sudah Dibayar ke Tim})$$
3. **Kas Bersih di Tangan (Uang Riil Aman):**
   $$\text{Kas Bersih} = \sum(\text{Pemasukan Klien}) - \sum(\text{Sudah Dibayar ke Tim})$$

---

## 🚦 Status Warna Otomatis (Smart Indicators)
- 🔴 **MERAH (Perlu Ditagih):** Muncul otomatis jika `Piutang Klien > 0`. Tombol WhatsApp Reminder aktif dengan template pesan sopan siap kirim.
- 🟡 **KUNING (Tanggungan Tim):** Muncul otomatis jika `Hutang Hak Tim > 0`.
- 🟢 **HIJAU (Lunas Selesai):** Muncul jika `Piutang = 0` dan `Hutang Tim = 0`.

---

## 🤖 AI Tracker: Analisis Pembayaran & Error Prevention Guard
Fitur **AI Tracker** hadir untuk menganalisis pembukuan pembayaran secara real-time demi meminimalisir kesalahan transaksi:
1. **Pencegahan Overpayment Klien:** Mendeteksi jika nominal pembayaran yang dicatat melebihi sisa piutang/nilai kontrak.
2. **Pencegahan Overpayment Tim:** Memastikan pencairan honor subkon tidak melebihi plafon kesepakatan.
3. **Deteksi Defisit Kas (Uang Talangan Pribadi):** Peringatan otomatis ketika pengeluaran honor tim mendahului penerimaan uang dari klien (`Kas Bersih < 0`).
4. **Deteksi Transaksi Ganda (Double Input):** Mendeteksi transaksi bernilai sama persis dalam rentang waktu berdekatan.
5. **Audit Aging & Deadline:** Pengingat intensif untuk piutang yang telah melewati batas waktu kontrak.
6. **Live Pre-Check Validator:** Memberikan umpan balik instan saat pengguna mengetik nominal di modal pembayaran sebelum disimpan.
7. **Simulator Transaksi Kas (What-If Analysis):** Memungkinkan pengujian simulasi dampak arus kas sebelum pencatatan transaksi nyata dieksekusi.
