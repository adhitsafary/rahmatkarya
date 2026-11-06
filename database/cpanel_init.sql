-- Database Init for cPanel (netdigi1_procash)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `team_payments`;
DROP TABLE IF EXISTS `project_team_members`;
DROP TABLE IF EXISTS `client_payments`;
DROP TABLE IF EXISTS `projects`;
DROP TABLE IF EXISTS `users`;

-- 1. Table users
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('ADMIN', 'FINANCE', 'VIEWER') NOT NULL DEFAULT 'ADMIN',
  `avatar` VARCHAR(255) NULL,
  `last_login` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_username` (`username`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table projects
CREATE TABLE `projects` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_code` VARCHAR(50) NOT NULL UNIQUE,
  `project_name` VARCHAR(191) NOT NULL,
  `client_name` VARCHAR(191) NOT NULL,
  `client_phone` VARCHAR(30) NULL,
  `total_contract_value` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `start_date` DATE NULL,
  `deadline_date` DATE NULL,
  `status` ENUM('ACTIVE', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_project_status` (`status`),
  INDEX `idx_project_client` (`client_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table client_payments
CREATE TABLE `client_payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT UNSIGNED NOT NULL,
  `invoice_number` VARCHAR(100) NULL,
  `payment_type` ENUM('DOWN_PAYMENT', 'TERMIN', 'FULL_PAYMENT') NOT NULL DEFAULT 'DOWN_PAYMENT',
  `amount_paid` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `payment_date` DATE NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'TRANSFER',
  `proof_attachment` VARCHAR(255) NULL,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_payment_project` (`project_id`),
  INDEX `idx_payment_date` (`payment_date`),
  CONSTRAINT `fk_client_payments_project` FOREIGN KEY (`project_id`) 
    REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table project_team_members
CREATE TABLE `project_team_members` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_id` INT UNSIGNED NOT NULL,
  `member_name` VARCHAR(191) NOT NULL,
  `member_role` VARCHAR(100) NULL,
  `member_phone` VARCHAR(30) NULL,
  `bank_account_info` VARCHAR(191) NULL,
  `agreed_honor` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_team_project` (`project_id`),
  CONSTRAINT `fk_team_project` FOREIGN KEY (`project_id`) 
    REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table team_payments
CREATE TABLE `team_payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `project_team_member_id` INT UNSIGNED NOT NULL,
  `amount_paid` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `payment_date` DATE NOT NULL,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'TRANSFER',
  `proof_attachment` VARCHAR(255) NULL,
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_team_payment_member` (`project_team_member_id`),
  INDEX `idx_team_payment_date` (`payment_date`),
  CONSTRAINT `fk_team_payment_member` FOREIGN KEY (`project_team_member_id`) 
    REFERENCES `project_team_members` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. SQL View
CREATE OR REPLACE VIEW `v_project_financial_summary` AS
SELECT 
    p.id AS project_id,
    p.project_code,
    p.project_name,
    p.client_name,
    p.client_phone,
    p.total_contract_value,
    p.status AS project_status,
    p.start_date,
    p.deadline_date,
    p.notes,
    
    COALESCE(cp.total_paid_client, 0.00) AS total_paid_by_client,
    (p.total_contract_value - COALESCE(cp.total_paid_client, 0.00)) AS client_receivable_remaining,
    COALESCE(tm.total_team_honor, 0.00) AS total_agreed_team_honor,
    COALESCE(tm.total_paid_team, 0.00) AS total_disbursed_to_team,
    (COALESCE(tm.total_team_honor, 0.00) - COALESCE(tm.total_paid_team, 0.00)) AS team_payable_remaining,
    
    (COALESCE(cp.total_paid_client, 0.00) - COALESCE(tm.total_paid_team, 0.00)) AS net_cash_in_hand,
    (p.total_contract_value - COALESCE(tm.total_team_honor, 0.00)) AS projected_net_profit,
    CASE 
      WHEN p.total_contract_value > 0 THEN 
        ROUND(((p.total_contract_value - COALESCE(tm.total_team_honor, 0.00)) / p.total_contract_value) * 100, 2)
      ELSE 0.00 
    END AS profit_margin_percentage,
    
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
    SELECT project_id, SUM(amount_paid) AS total_paid_client
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

-- Seed Users
INSERT INTO `users` (`id`, `name`, `username`, `email`, `password`, `role`) VALUES
(1, 'Administrator', 'admin', 'admin@procash.local', '$2y$10$pO.SXcrxPxrumLmR5UwnI.ThABJXuZZedxNGGf9GAV0rtHHOYYnBS', 'ADMIN'),
(2, 'Finance Manager', 'finance', 'finance@procash.local', '$2y$10$ETu6q1ISVPqFjrH5Kk0ABe0LQBQC82CU/kQQfPdBnQ3h6x1YkEMlS', 'ADMIN'),
(3, 'Dewi Sartika', 'dewi', 'dewi@procash.local', '$2y$10$NYi/KwJN6jTWkcCuo5naSOsr1tCoR.vnuYukeBzIkp0OiY2k5umbO', 'FINANCE'),
(4, 'cek', 'cek', 'adhitsafary@gmail.com', '$2y$10$7tm6hxAM/TvU8HjYPqkZ5.a6ornIlmHgbCz1Dcow6R9jdVrKoLgGC', 'FINANCE'),
(5, 'test_viewer@gmail.com', 'aditndg', 'test_viewer@gmail.com', '$2y$10$0hRMnLQ.r0mWb6OU5JwJ0O.5I9cwqtxXOAo7zb5JoMV7Rc1zPlGya', 'VIEWER');

-- Seed Projects
INSERT INTO `projects` (`id`, `project_code`, `project_name`, `client_name`, `client_phone`, `total_contract_value`, `start_date`, `deadline_date`, `status`, `notes`) VALUES
(1, 'PRJ-2026-001', 'Proyek Jonggol', 'Klien Jonggol', '081234567890', 11000000.00, '2026-10-15', '2026-12-15', 'ACTIVE', 'Tim A (4,5jt) & Tim B (1jt); masing-masing baru DP'),
(2, 'PRJ-2026-002', 'Brica', 'PT Brica Indonesia', '081324567891', 8000000.00, '2026-10-18', '2026-11-20', 'ACTIVE', 'Laporan analisa struktur. Sisa 2,5jt cair minggu depan'),
(3, 'PRJ-2026-003', 'Renovasi Interior Kafe Senja', 'Bpk. Hendra Wijaya', '081987654321', 15000000.00, '2026-10-01', '2026-10-28', 'COMPLETED', 'Pekerjaan selesai 100%, semua pembayaran lunas'),
(4, 'PRJ-2026-004', 'Aplikasi Kasir Toko Berkah', 'Ibu Ratna', '085712345678', 6500000.00, '2026-10-20', '2026-11-25', 'ACTIVE', 'Baru masuk DP 2jt. Desain UI disetujui'),
(5, 'PRJ-2026-005', 'Branding & Social Media Kit', 'CV Maju Bersama', '087890123456', 5000000.00, '2026-10-22', '2026-11-15', 'ACTIVE', 'Pembayaran 50% masuk. Drafting konten minggu 1'),
(6, 'PRJ-2026-006', 'Audit Struktur Gudang Logistik', 'PT Cipta Sarana', '082134567890', 12000000.00, '2026-09-15', '2026-10-15', 'COMPLETED', 'Laporan final sudah diserahkan');

-- Seed Client Payments
INSERT INTO `client_payments` (`id`, `project_id`, `invoice_number`, `payment_type`, `amount_paid`, `payment_date`, `payment_method`, `notes`) VALUES
(1, 1, 'INV-PRJ-2026-001-01', 'DOWN_PAYMENT', 2750000.00, '2026-10-15', 'TRANSFER_BCA', 'DP 25% Proyek Jonggol'),
(2, 2, 'INV-PRJ-2026-002-01', 'TERMIN', 5500000.00, '2026-10-18', 'TRANSFER_BCA', 'Termin Progres 1 & 2'),
(3, 4, 'INV-PRJ-2026-004-01', 'DOWN_PAYMENT', 2000000.00, '2026-10-20', 'TRANSFER_BCA', 'DP Awal Proyek'),
(4, 5, 'INV-PRJ-2026-005-01', 'TERMIN', 2500000.00, '2026-10-22', 'TRANSFER_BCA', 'Pembayaran 50%'),
(5, 1, 'INV-1-02', 'TERMIN', 8250000.00, '2026-11-01', 'TRANSFER BCA', 'Pelunasan Jonggol');

-- Seed Team Members
INSERT INTO `project_team_members` (`id`, `project_id`, `member_name`, `member_role`, `member_phone`, `bank_account_info`, `agreed_honor`) VALUES
(1, 1, 'Tim A (Drafter & Analisis)', 'Drafter CAD & Estimator', '081299887766', 'BCA 1234567890 a.n Tim A', 4500000.00),
(2, 1, 'Tim B (Survey Lapangan)', 'Surveyor', '081388776655', 'Mandiri 0987654321 a.n Tim B', 1000000.00),
(3, 2, 'Tim Analis Struktur', 'Senior Engineer', '081577665544', 'BNI 1122334455 a.n Analis', 859000.00),
(4, 3, 'Tukang & Material Mandor Joko', 'Pelaksana Lapangan', '081666554433', 'BRI 5544332211 a.n Joko', 9000000.00),
(5, 4, 'Budi Frontend Dev', 'React / Vue Developer', '081755443322', 'BCA 9988112233 a.n Budi', 3000000.00),
(6, 5, 'Sari Graphic Designer', 'Visual & Brand Identity', '081844332211', 'Jenius 2233445566 a.n Sari', 2000000.00);

-- Seed Team Payments
INSERT INTO `team_payments` (`id`, `project_team_member_id`, `amount_paid`, `payment_date`, `payment_method`, `notes`) VALUES
(1, 1, '1000000.00', '2026-10-16', 'TRANSFER', 'DP Pengerjaan Gambar'),
(2, 3, '750000.00', '2026-10-19', 'TRANSFER', 'Honor Tahap 1'),
(3, 4, '9000000.00', '2026-10-28', 'TRANSFER', 'Pelunasan Honor & Material Kafe Senja');

SET FOREIGN_KEY_CHECKS = 1;
