-- =====================================================================
-- DATABASE SCHEMA: ProCash Tracker (Freelance & Cashflow Reminder)
-- Target RDBMS: MySQL 8.0+ / MariaDB 10.4+ (XAMPP Compatible)
-- Author: Antigravity for Pak Rahmat & Team
-- Updated to align with Dual Dashboard Flowchart:
--   1. Dashboard Admin (Kontrak, DP, Sistem Pembayaran, Revisi -> Deal -> Pembayaran Akhir -> Done)
--   2. Dashboard Client (Project, DP, Harga, Durasi, Termin Uang, Revisi, Progress Chart, PDF, WA & Email)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `procash_tracker` 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `procash_tracker`;

-- Disable FK checks during table creation
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 0. Table: users (Autentikasi & Akun Pengguna)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'Nama Lengkap Pengguna',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Username untuk login',
  `email` VARCHAR(191) NOT NULL UNIQUE COMMENT 'Email pengguna',
  `password` VARCHAR(255) NOT NULL COMMENT 'Bcrypt Hashed Password',
  `role` ENUM('ADMIN', 'FINANCE', 'VIEWER', 'CLIENT') NOT NULL DEFAULT 'ADMIN',
  `avatar` VARCHAR(255) NULL,
  `last_login` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_username` (`username`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 0b. Table: app_settings (Pengaturan Aplikasi & Integrasi API)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `app_settings`;
CREATE TABLE `app_settings` (
  `key_name` VARCHAR(100) NOT NULL PRIMARY KEY,
  `key_value` TEXT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 0c. Table: ai_chat_sessions (Sesi Percakapan Asisten AI Gemini)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `ai_chat_sessions`;
CREATE TABLE `ai_chat_sessions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `session_id` VARCHAR(64) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NULL,
  `title` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_session_user` (`user_id`),
  INDEX `idx_session_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 0d. Table: ai_chat_messages (Riwayat Percakapan Asisten AI Gemini)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `ai_chat_messages`;
CREATE TABLE `ai_chat_messages` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL COMMENT 'ID pengguna yang mengirim prompt (opsional)',
  `session_id` VARCHAR(64) NULL COMMENT 'ID sesi percakapan',
  `role` ENUM('user', 'model') NOT NULL COMMENT 'Pengirim pesan: user atau AI model',
  `message` LONGTEXT NOT NULL COMMENT 'Isi teks prompt atau balasan AI',
  `model` VARCHAR(50) NULL DEFAULT 'gemini-1.5-flash' COMMENT 'Model AI yang digunakan',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_chat_user` (`user_id`),
  INDEX `idx_chat_session` (`session_id`),
  INDEX `idx_chat_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 1. Table: projects (Master Proyek Sesuai Diagram Flowchart)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `projects`;
CREATE TABLE `projects` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Kode unik proyek, misal PRJ-2026-001',
  `contract_number` VARCHAR(100) NULL COMMENT 'No Kontrak / SPK (Input Manual / Auto)',
  `contract_date` DATE NULL COMMENT 'Tanggal Penandatanganan Kontrak',
  `project_name` VARCHAR(191) NOT NULL COMMENT 'Nama Proyek (a. Nama Project)',
  `project_detail` TEXT NULL COMMENT 'Detail deskripsi & lingkup pekerjaan proyek',
  `client_name` VARCHAR(191) NOT NULL COMMENT 'Nama Klien / Perusahaan (b. Nama Client)',
  `client_phone` VARCHAR(30) NULL COMMENT 'No HP/WhatsApp Klien untuk reminder & auto WA',
  `client_email` VARCHAR(191) NULL COMMENT 'Email Klien untuk auto kirim email invoice',
  `client_access_token` VARCHAR(64) NULL UNIQUE COMMENT 'Token unik portal client tanpa perlu login',
  `total_contract_value` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'c. Total Tagihan Proyek (Nominal Uang)',
  `start_date` DATE NULL COMMENT 'e. Durasi Awal Pekerjaan',
  `deadline_date` DATE NULL COMMENT 'e. Durasi Akhir Pekerjaan (Deadline)',
  `max_revisions` INT UNSIGNED NOT NULL DEFAULT 3 COMMENT 'g. Kuota Revisi Mayor Maksimal (3-5x)',
  `current_revision` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Jumlah revisi yang telah diajukan',
  `revision_deal_status` ENUM('PENDING', 'IN_REVISION', 'DEAL_APPROVED') NOT NULL DEFAULT 'PENDING' COMMENT 'Status revisi sampai dengan deal',
  `workflow_step` ENUM('KONTRAK_DP', 'PENGERJAAN', 'REVISI', 'PEMBAYARAN_AKHIR', 'DONE') NOT NULL DEFAULT 'KONTRAK_DP' COMMENT 'Tahap alur proses di flowchart',
  `progress_percent` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Progres pengerjaan real-time (0-100%)',
  `status` ENUM('ACTIVE', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_project_status` (`status`),
  INDEX `idx_project_workflow` (`workflow_step`),
  INDEX `idx_project_client` (`client_name`),
  INDEX `idx_project_token` (`client_access_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Table: project_payment_terms (f. Sistem Pembayaran Input Manual dalam Rupiah)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `project_payment_terms`;
CREATE TABLE `project_payment_terms` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT UNSIGNED NOT NULL,
  `term_name` VARCHAR(100) NOT NULL COMMENT 'Nama termin, contoh: DP 25%, Termin 50%, Pelunasan 25%',
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Nominal uang riil yang disepakati (Rp, bukan sekadar %)',
  `due_date` DATE NULL COMMENT 'Tanggal jatuh tempo',
  `status` ENUM('PENDING', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
  `paid_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Nominal yang sudah dibayarkan',
  `paid_date` DATE NULL COMMENT 'Tanggal realisasi pembayaran',
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payment_terms_project` 
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_term_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Table: project_revisions (g. Tracking Revisi sampai dengan Deal / Max Revisi)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `project_revisions`;
CREATE TABLE `project_revisions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT UNSIGNED NOT NULL,
  `revision_number` INT UNSIGNED NOT NULL COMMENT 'Revisi ke-1, ke-2, dst',
  `title` VARCHAR(191) NOT NULL COMMENT 'Judul / Bagian yang direvisi',
  `description` TEXT NOT NULL COMMENT 'Catatan revisi detail dari klien',
  `requested_by` VARCHAR(100) NOT NULL DEFAULT 'Client',
  `status` ENUM('SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'DEAL_APPROVED') NOT NULL DEFAULT 'SUBMITTED',
  `requested_date` DATE NOT NULL,
  `deal_date` DATE NULL COMMENT 'Tanggal disetujui / deal',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_revisions_project` 
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_rev_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Table: client_payments (Pemasukan Riil dari Klien)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `client_payments`;
CREATE TABLE `client_payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT UNSIGNED NOT NULL,
  `invoice_number` VARCHAR(100) NULL COMMENT 'No invoice penagihan',
  `payment_type` ENUM('DOWN_PAYMENT', 'TERMIN', 'FULL_PAYMENT') NOT NULL DEFAULT 'DOWN_PAYMENT',
  `amount_paid` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Jumlah uang yang diterima dari klien',
  `payment_date` DATE NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'TRANSFER' COMMENT 'BCA, Mandiri, Cash, dll',
  `proof_attachment` VARCHAR(255) NULL COMMENT 'Path bukti transfer/kuitansi',
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_client_payments_project` 
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_payment_project` (`project_id`),
  INDEX `idx_payment_date` (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Table: project_team_members (Alokasi Tim & Komitmen Honor)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `project_team_members`;
CREATE TABLE `project_team_members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT UNSIGNED NOT NULL,
  `member_name` VARCHAR(191) NOT NULL COMMENT 'Nama rekan kerja/vendor subkon',
  `member_role` VARCHAR(100) NULL COMMENT 'Peran: Drafter CAD, Arsitek, Estimator RAB, Ahli Struktur, ME, dll',
  `member_phone` VARCHAR(30) NULL COMMENT 'No WhatsApp anggota tim',
  `bank_account_info` VARCHAR(191) NULL COMMENT 'Rekening tujuan: BCA 123456 a.n Budi',
  `agreed_honor` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total honor yang disepakati untuk proyek ini',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_team_project` 
    FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_team_project` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. Table: team_payments (Penyaluran Pembayaran ke Tim)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `team_payments`;
CREATE TABLE `team_payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_team_member_id` INT UNSIGNED NOT NULL,
  `amount_paid` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Nominal yang dibayarkan ke tim',
  `payment_date` DATE NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'TRANSFER',
  `proof_attachment` VARCHAR(255) NULL,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_team_payments_member` 
    FOREIGN KEY (`project_team_member_id`) REFERENCES `project_team_members` (`id`) 
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_team_payment_member` (`project_team_member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 7. Database View: v_project_financial_summary
-- Mengotomatisasi seluruh kalkulasi finansial, kuota revisi, & status workflow
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS `v_project_financial_summary`;
CREATE VIEW `v_project_financial_summary` AS
SELECT 
    p.id AS project_id,
    p.project_code,
    p.contract_number,
    p.contract_date,
    p.project_name,
    p.project_detail,
    p.client_name,
    p.client_phone,
    p.client_email,
    p.client_access_token,
    p.total_contract_value,
    p.status AS project_status,
    p.workflow_step,
    p.progress_percent,
    p.start_date,
    p.deadline_date,
    DATEDIFF(COALESCE(p.deadline_date, CURDATE()), COALESCE(p.start_date, CURDATE())) AS duration_days,
    DATEDIFF(COALESCE(p.deadline_date, CURDATE()), CURDATE()) AS days_left_to_deadline,
    p.max_revisions,
    p.current_revision,
    GREATEST(0, CAST(p.max_revisions AS SIGNED) - CAST(p.current_revision AS SIGNED)) AS remaining_revisions,
    p.revision_deal_status,
    p.notes,
    
    -- 1. Pemasukan Klien & DP
    COALESCE(cp.total_paid_client, 0.00) AS total_paid_by_client,
    COALESCE(cp.total_dp_paid, 0.00) AS total_dp_paid,
    (p.total_contract_value - COALESCE(cp.total_paid_client, 0.00)) AS client_receivable_remaining,
    CASE 
      WHEN p.total_contract_value > 0 THEN 
        ROUND((COALESCE(cp.total_paid_client, 0.00) / p.total_contract_value) * 100, 1)
      ELSE 0.0 
    END AS client_payment_progress_percent,
    
    -- 2. Komitmen & Pembayaran Tim
    COALESCE(tm.total_team_honor, 0.00) AS total_agreed_team_honor,
    COALESCE(tm.total_paid_team, 0.00) AS total_disbursed_to_team,
    (COALESCE(tm.total_team_honor, 0.00) - COALESCE(tm.total_paid_team, 0.00)) AS team_payable_remaining,
    
    -- 3. Kas Bersih Riil (Uang di Tangan)
    (COALESCE(cp.total_paid_client, 0.00) - COALESCE(tm.total_paid_team, 0.00)) AS net_cash_in_hand,
    
    -- 4. Proyeksi Keuntungan Bersih (Profit Margin)
    (p.total_contract_value - COALESCE(tm.total_team_honor, 0.00)) AS projected_net_profit,
    CASE 
      WHEN p.total_contract_value > 0 THEN 
        ROUND(((p.total_contract_value - COALESCE(tm.total_team_honor, 0.00)) / p.total_contract_value) * 100, 2)
      ELSE 0.00 
    END AS profit_margin_percentage,
    
    -- 5. Smart Reminder Flags & Status Color
    CASE 
      WHEN (p.total_contract_value - COALESCE(cp.total_paid_client, 0.00)) > 0 THEN 1 
      ELSE 0 
    END AS flag_has_unpaid_receivable,
    
    CASE 
      WHEN (COALESCE(tm.total_team_honor, 0.00) - COALESCE(tm.total_paid_team, 0.00)) > 0 THEN 1 
      ELSE 0 
    END AS flag_has_unpaid_payable,
    
    CASE 
      WHEN (p.total_contract_value - COALESCE(cp.total_paid_client, 0.00)) <= 0 
       AND (COALESCE(tm.total_team_honor, 0.00) - COALESCE(tm.total_paid_team, 0.00)) <= 0 
      THEN 'GREEN_SETTLED'
      WHEN (p.total_contract_value - COALESCE(cp.total_paid_client, 0.00)) > 0 
       AND (COALESCE(tm.total_team_honor, 0.00) - COALESCE(tm.total_paid_team, 0.00)) > 0 
      THEN 'RED_AND_YELLOW_PENDING'
      WHEN (p.total_contract_value - COALESCE(cp.total_paid_client, 0.00)) > 0 
      THEN 'RED_RECEIVABLE_PENDING'
      ELSE 'YELLOW_TEAM_PENDING'
    END AS visual_status_badge

FROM `projects` p

LEFT JOIN (
    SELECT 
        project_id, 
        SUM(amount_paid) AS total_paid_client,
        SUM(CASE WHEN payment_type = 'DOWN_PAYMENT' THEN amount_paid ELSE 0 END) AS total_dp_paid
    FROM `client_payments`
    GROUP BY project_id
) cp ON cp.project_id = p.id

LEFT JOIN (
    SELECT 
        ptm.project_id,
        SUM(ptm.agreed_honor) AS total_team_honor,
        SUM(COALESCE(tp_sub.total_paid_member, 0.00)) AS total_paid_team
    FROM `project_team_members` ptm
    LEFT JOIN (
        SELECT project_team_member_id, SUM(amount_paid) AS total_paid_member
        FROM `team_payments`
        GROUP BY project_team_member_id
    ) tp_sub ON tp_sub.project_team_member_id = ptm.id
    GROUP BY ptm.project_id
) tm ON tm.project_id = p.id;

-- ---------------------------------------------------------------------
-- 8. Seed Default Users
-- ---------------------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `username`, `email`, `password`, `role`) VALUES
(1, 'Administrator', 'admin', 'admin@procash.local', '$2y$10$FptIuYBMddQX9/WzUWQcguYuehljgoMf8JJEE0WETZlXB5TDKD/e2', 'ADMIN'),
(2, 'Tim Finance', 'finance', 'finance@procash.local', '$2y$10$Y61vTaMf1F5x8Rehdxeta.tOxEIIGBWHJ4xDxODu0Y2whtwr70ayW', 'FINANCE'),
(3, 'Portal Klien Mitra', 'client', 'client@procash.local', '$2y$10$hWipIKf8c8cf8utMeYn0MuWiBOLXM3ywu4iJHD0mwd5vypv3uiHJ2', 'CLIENT')
ON DUPLICATE KEY UPDATE name=VALUES(name), password=VALUES(password), role=VALUES(role);

-- ---------------------------------------------------------------------
-- 9. Sample Data: Proyek Jonggol Sesuai Catatan Flowchart
--   - No Kontrak: SPK/2026/011-JGL
--   - Tgl Kontrak: 2026-11-01
--   - a. Nama Project: Proyek Jonggol (detail: Sistem Branding & Web Portal Penjualan Properti Jonggol)
--   - b. Nama Client: PT Mitra Perkasa Jonggol
--   - c. Total tagihan proyek: Rp 11.000.000
--   - d. DP Awal: Rp 2.750.000 (Case Jonggol DP 25% -> dibuat jadi uang bukan persen)
--   - e. Durasi awal - akhir: 2026-11-01 s/d 2026-12-15 (45 hari kerja)
--   - f. Sistem pembayaran manual: DP Rp 2.750.000, Termin Rp 5.500.000, Pelunasan Rp 2.750.000
--   - g. Revisi ($max = 3x, Revisi ke-1 aktif, status menuju Deal)
-- ---------------------------------------------------------------------
INSERT INTO `projects` 
  (`id`, `project_code`, `contract_number`, `contract_date`, `project_name`, `project_detail`, `client_name`, `client_phone`, `client_email`, `client_access_token`, `total_contract_value`, `start_date`, `deadline_date`, `max_revisions`, `current_revision`, `revision_deal_status`, `workflow_step`, `progress_percent`, `status`, `notes`)
VALUES
  (1, 'PRJ-2026-001', 'SPK/2026/011-JGL', '2026-11-01', 'Proyek Jonggol', 'Perancangan arsitektur desain bangunan, konsep denah 3D render, DED (Detail Engineering Design), dan site plan kawasan Jonggol Terpadu.', 'PT Mitra Perkasa Jonggol', '081234567890', 'mitraperkasa@jonggol.co.id', 'client-jonggol-2026', 11000000.00, '2026-11-01', '2026-12-15', 3, 1, 'IN_REVISION', 'REVISI', 65, 'ACTIVE', 'Case Jonggol: DP 25% (Rp 2.750.000), Termin 50% (Rp 5.500.000), Pelunasan 25% (Rp 2.750.000). Max 3x revisi mayor.'),
  (2, 'PRJ-2026-002', 'SPK/2026/012-PF', '2026-10-10', 'Desain Rumah Modern 2 Lantai', 'Paket gambar kerja arsitektur DED, 3D visual render eksterior & interior, serta RAB konstruksi.', 'Mas Doni', '085678901234', 'doni@portfolio.id', 'client-doni-2026', 5000000.00, '2026-10-10', '2026-10-30', 2, 2, 'DEAL_APPROVED', 'DONE', 100, 'COMPLETED', 'Proyek telah deal dan lunas selesai 100%.');

-- Sistem Pembayaran Manual dalam Uang (Rupiah) Proyek Jonggol
INSERT INTO `project_payment_terms`
  (`project_id`, `term_name`, `amount`, `due_date`, `status`, `paid_amount`, `paid_date`, `notes`)
VALUES
  (1, 'DP Awal (25%)', 2750000.00, '2026-11-01', 'PAID', 2750000.00, '2026-11-01', 'DP Awal 25% diterima tunai via transfer'),
  (1, 'Termin Pengerjaan (50%)', 5500000.00, '2026-11-20', 'PENDING', 0.00, NULL, 'Termin pengerjaan gambar kerja DED & 3D visualisasi'),
  (1, 'Pelunasan Akhir (25%)', 2750000.00, '2026-12-15', 'PENDING', 0.00, NULL, 'Pelunasan setelah serah terima berkas final DED, RAB & deal revisi');

-- Riwayat Revisi Proyek Jonggol
INSERT INTO `project_revisions`
  (`project_id`, `revision_number`, `title`, `description`, `requested_by`, `status`, `requested_date`, `deal_date`)
VALUES
  (1, 1, 'Revisi Fasad & Layout Denah Ruangan', 'Penyesuaian fasad tampak depan lantai 2, pergeseran denah kamar utama, dan penambahan bukaan kanopi teras sesuai feedback owner.', 'PT Mitra Perkasa Jonggol', 'IN_PROGRESS', '2026-11-03', NULL);

-- Realisasi Pembayaran Klien
INSERT INTO `client_payments`
  (`project_id`, `invoice_number`, `payment_type`, `amount_paid`, `payment_date`, `payment_method`, `notes`)
VALUES
  (1, 'INV-2026-001-DP', 'DOWN_PAYMENT', 2750000.00, '2026-11-01', 'TRANSFER_BCA', 'DP 25% Proyek Jonggol (Rp 2.750.000)'),
  (2, 'INV-2026-002-DP', 'DOWN_PAYMENT', 2500000.00, '2026-10-10', 'TRANSFER_MANDIRI', 'DP 50% Desain Rumah'),
  (2, 'INV-2026-003-FIN', 'FULL_PAYMENT', 2500000.00, '2026-10-25', 'TRANSFER_MANDIRI', 'Pelunasan akhir 50%');

-- Alokasi Tim Pendukung
INSERT INTO `project_team_members`
  (`id`, `project_id`, `member_name`, `member_role`, `member_phone`, `bank_account_info`, `agreed_honor`)
VALUES
  (1, 1, 'Laras / Drafter CAD', 'Drafter Arsitektur & Struktur', '081987654321', 'BCA 8820192819 a.n Laras', 3000000.00),
  (2, 2, 'Rizky / 3D Visualizer', '3D Visualizer & Render', '081345678901', 'Mandiri 1370019281 a.n Rizky', 1500000.00);

-- Pembayaran ke Tim
INSERT INTO `team_payments`
  (`project_team_member_id`, `amount_paid`, `payment_date`, `payment_method`, `notes`)
VALUES
  (1, 1000000.00, '2026-11-01', 'TRANSFER_BCA', 'DP Honor Laras Proyek Jonggol'),
  (2, 1500000.00, '2026-10-26', 'TRANSFER_BCA', 'Pelunasan Honor Rizky');
