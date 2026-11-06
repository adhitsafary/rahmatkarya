-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: procash_tracker
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `client_payments`
--

DROP TABLE IF EXISTS `client_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `client_payments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `project_id` int(10) unsigned NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL COMMENT 'No invoice penagihan',
  `payment_type` enum('DOWN_PAYMENT','TERMIN','FULL_PAYMENT') NOT NULL DEFAULT 'DOWN_PAYMENT',
  `amount_paid` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Jumlah uang yang diterima dari klien',
  `payment_date` date NOT NULL,
  `payment_method` varchar(50) NOT NULL DEFAULT 'TRANSFER' COMMENT 'BCA, Mandiri, Cash, dll',
  `proof_attachment` varchar(255) DEFAULT NULL COMMENT 'Path bukti transfer/kuitansi',
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_payment_project` (`project_id`),
  KEY `idx_payment_date` (`payment_date`),
  CONSTRAINT `fk_client_payments_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `client_payments`
--

LOCK TABLES `client_payments` WRITE;
/*!40000 ALTER TABLE `client_payments` DISABLE KEYS */;
INSERT INTO `client_payments` VALUES (1,1,'INV-PRJ-2026-001-01','DOWN_PAYMENT',2750000.00,'2026-10-15','TRANSFER_BCA',NULL,'DP 25% Proyek Jonggol','2026-11-01 10:38:50'),(2,2,'INV-PRJ-2026-002-01','TERMIN',5500000.00,'2026-10-18','TRANSFER_BCA',NULL,'Termin Progres 1 & 2','2026-11-01 10:38:50'),(3,4,'INV-PRJ-2026-004-01','DOWN_PAYMENT',2000000.00,'2026-10-20','TRANSFER_BCA',NULL,'DP Awal Proyek','2026-11-01 10:38:50'),(4,5,'INV-PRJ-2026-005-01','TERMIN',2500000.00,'2026-10-22','TRANSFER_BCA',NULL,'Pembayaran 50%','2026-11-01 10:38:50'),(5,1,'INV-1-02','TERMIN',8250000.00,'2026-11-01','TRANSFER BCA',NULL,'cek','2026-11-01 11:07:00'),(6,7,'INV-2026-007-DP','DOWN_PAYMENT',2000000.00,'2026-11-01','TRANSFER',NULL,'DP Awal saat pembuatan proyek','2026-11-01 13:36:58'),(7,7,'INV-7-02','TERMIN',2000000.00,'2026-11-01','TRANSFER BCA',NULL,'test bayar','2026-11-01 13:38:16'),(8,7,'INV-7-03','TERMIN',4000000.00,'2026-11-01','TRANSFER BCA',NULL,'test bayar 2','2026-11-01 13:40:47'),(9,7,'INV-7-04','TERMIN',2000000.00,'2026-11-01','TRANSFER BCA',NULL,'test ke 3','2026-11-01 13:41:16');
/*!40000 ALTER TABLE `client_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_team_members`
--

DROP TABLE IF EXISTS `project_team_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `project_team_members` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `project_id` int(10) unsigned NOT NULL,
  `member_name` varchar(191) NOT NULL COMMENT 'Nama rekan kerja/vendor subkon',
  `member_role` varchar(100) DEFAULT NULL COMMENT 'Peran: UI/UX Designer, Backend, Copywriter, dll',
  `member_phone` varchar(30) DEFAULT NULL COMMENT 'No WhatsApp anggota tim',
  `bank_account_info` varchar(191) DEFAULT NULL COMMENT 'Rekening tujuan: BCA 123456 a.n Budi',
  `agreed_honor` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total honor yang disepakati untuk proyek ini',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_team_project` (`project_id`),
  CONSTRAINT `fk_team_project` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_team_members`
--

LOCK TABLES `project_team_members` WRITE;
/*!40000 ALTER TABLE `project_team_members` DISABLE KEYS */;
INSERT INTO `project_team_members` VALUES (1,1,'Tim A','Struktur Utama',NULL,NULL,4500000.00,'2026-11-01 10:38:50','2026-11-01 10:38:50'),(2,1,'Tim B','Drafter & Analisis',NULL,NULL,1000000.00,'2026-11-01 10:38:50','2026-11-01 10:38:50'),(3,2,'Tim Analisa Struktur','Laporan Struktur',NULL,NULL,750000.00,'2026-11-01 10:38:50','2026-11-01 10:38:50'),(4,3,'Tim Analisa Struktur','Laporan Struktur',NULL,NULL,500000.00,'2026-11-01 10:38:50','2026-11-01 10:38:50'),(5,2,'Cek','Cek','','',109000.00,'2026-11-01 11:07:29','2026-11-01 11:07:29'),(6,7,'Adit','test','','',100000.00,'2026-11-01 13:44:34','2026-11-01 13:44:34'),(7,7,'alex','ui ux','','',100000.00,'2026-11-01 13:44:55','2026-11-01 13:44:55'),(8,1,'alex','aasa','','',111111.00,'2026-11-02 02:20:21','2026-11-02 02:20:21');
/*!40000 ALTER TABLE `project_team_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `projects` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `project_code` varchar(50) NOT NULL COMMENT 'Kode unik proyek, misal PRJ-2026-001',
  `project_name` varchar(191) NOT NULL COMMENT 'Nama proyek, misal: Proyek Jonggol',
  `client_name` varchar(191) NOT NULL COMMENT 'Nama klien/perusahaan',
  `client_phone` varchar(30) DEFAULT NULL COMMENT 'No HP/WhatsApp klien untuk reminder',
  `total_contract_value` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Nilai total tagihan kontrak',
  `start_date` date DEFAULT NULL,
  `deadline_date` date DEFAULT NULL,
  `status` enum('ACTIVE','COMPLETED','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `project_code` (`project_code`),
  KEY `idx_project_status` (`status`),
  KEY `idx_project_client` (`client_name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
INSERT INTO `projects` VALUES (1,'PRJ-2026-001','Jonggol','Klien Jonggol','081234567891',11000000.00,'2026-10-01',NULL,'ACTIVE','Tim A (4,5jt) & Tim B (1jt); masing-masing baru di-DP 500rb.','2026-11-01 10:38:50','2026-11-01 10:38:50'),(2,'PRJ-2026-002','Brica','PT Brica Indonesia','081234567892',8000000.00,'2026-10-01',NULL,'ACTIVE','Laporan analisa struktur. Sisa 2,5jt cair saat presentasi.','2026-11-01 10:38:50','2026-11-01 10:38:50'),(3,'PRJ-2026-003','Restika','Ibu Restika','081234567893',8000000.00,'2026-10-01',NULL,'ACTIVE','Laporan analisa struktur. Belum ada pembayaran masuk.','2026-11-01 10:38:50','2026-11-01 10:38:50'),(4,'PRJ-2026-004','BMKG','Satker BMKG','081234567894',7000000.00,'2026-10-01',NULL,'ACTIVE','Sudah menerima DP 2jt.','2026-11-01 10:38:50','2026-11-01 10:38:50'),(5,'PRJ-2026-005','RS Siloam','Manajemen RS Siloam','081234567895',5000000.00,'2026-10-01',NULL,'ACTIVE','Proyek metode. Baru dibayar 50%.','2026-11-01 10:38:50','2026-11-01 10:38:50'),(6,'PRJ-2026-006','Rumah Agin','Bpk. Agin','081234567896',3000000.00,'2026-10-01',NULL,'ACTIVE','Nilai asli 6jt, namun hanya ditagih 3jt. Belum dibayar.','2026-11-01 10:38:50','2026-11-01 10:38:50'),(7,'PRJ-2026-007','Angin ribut Project','PT Angin ribut','021212123',10000000.00,'2026-11-01',NULL,'ACTIVE','Test mantap bos','2026-11-01 13:36:58','2026-11-01 13:36:58');
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_payments`
--

DROP TABLE IF EXISTS `team_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team_payments` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `project_team_member_id` int(10) unsigned NOT NULL,
  `amount_paid` decimal(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Nominal yang dibayarkan ke tim',
  `payment_date` date NOT NULL,
  `payment_method` varchar(50) NOT NULL DEFAULT 'TRANSFER',
  `proof_attachment` varchar(255) DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_team_payment_member` (`project_team_member_id`),
  CONSTRAINT `fk_team_payments_member` FOREIGN KEY (`project_team_member_id`) REFERENCES `project_team_members` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_payments`
--

LOCK TABLES `team_payments` WRITE;
/*!40000 ALTER TABLE `team_payments` DISABLE KEYS */;
INSERT INTO `team_payments` VALUES (1,1,500000.00,'2026-10-25','TRANSFER_BCA',NULL,'DP Tim A','2026-11-01 10:38:50'),(2,2,500000.00,'2026-10-25','TRANSFER_BCA',NULL,'DP Tim B','2026-11-01 10:38:50'),(3,3,750000.00,'2026-10-25','TRANSFER_BCA',NULL,'Honor Lunas','2026-11-01 10:38:50'),(4,4,500000.00,'2026-10-25','TRANSFER_BCA',NULL,'Talangan honor lunas','2026-11-01 10:38:50');
/*!40000 ALTER TABLE `team_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT 'Nama Lengkap Pengguna',
  `username` varchar(50) NOT NULL COMMENT 'Username untuk login',
  `email` varchar(191) NOT NULL COMMENT 'Email pengguna',
  `password` varchar(255) NOT NULL COMMENT 'Bcrypt Hashed Password',
  `role` enum('ADMIN','FINANCE','VIEWER') NOT NULL DEFAULT 'ADMIN',
  `avatar` varchar(255) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_username` (`username`),
  KEY `idx_users_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Administrator','admin','admin@procash.local','$2y$10$pO.SXcrxPxrumLmR5UwnI.ThABJXuZZedxNGGf9GAV0rtHHOYYnBS','ADMIN',NULL,'2026-11-02 00:29:20','2026-11-01 11:40:06','2026-11-02 00:29:20'),(2,'Finance Manager','finance','finance@procash.local','$2y$10$ETu6q1ISVPqFjrH5Kk0ABe0LQBQC82CU/kQQfPdBnQ3h6x1YkEMlS','ADMIN',NULL,'2026-11-02 00:06:01','2026-11-01 11:40:16','2026-11-02 00:06:01'),(3,'Dewi Sartika','dewi','dewi@procash.local','$2y$10$NYi/KwJN6jTWkcCuo5naSOsr1tCoR.vnuYukeBzIkp0OiY2k5umbO','FINANCE',NULL,NULL,'2026-11-01 11:58:11','2026-11-01 11:58:11'),(4,'cek','cek','adhitsafary@gmail.com','$2y$10$7tm6hxAM/TvU8HjYPqkZ5.a6ornIlmHgbCz1Dcow6R9jdVrKoLgGC','FINANCE',NULL,NULL,'2026-11-02 01:33:03','2026-11-02 01:33:03'),(5,'test_viewer@gmail.com','aditndg','test_viewer@gmail.com','$2y$10$0hRMnLQ.r0mWb6OU5JwJ0O.5I9cwqtxXOAo7zb5JoMV7Rc1zPlGya','VIEWER',NULL,'2026-11-02 02:19:59','2026-11-02 02:19:54','2026-11-02 02:19:59');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `v_project_financial_summary`
--

DROP TABLE IF EXISTS `v_project_financial_summary`;
/*!50001 DROP VIEW IF EXISTS `v_project_financial_summary`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `v_project_financial_summary` AS SELECT
 1 AS `project_id`,
  1 AS `project_code`,
  1 AS `project_name`,
  1 AS `client_name`,
  1 AS `client_phone`,
  1 AS `total_contract_value`,
  1 AS `project_status`,
  1 AS `start_date`,
  1 AS `deadline_date`,
  1 AS `notes`,
  1 AS `total_paid_by_client`,
  1 AS `client_receivable_remaining`,
  1 AS `total_agreed_team_honor`,
  1 AS `total_disbursed_to_team`,
  1 AS `team_payable_remaining`,
  1 AS `net_cash_in_hand`,
  1 AS `projected_net_profit`,
  1 AS `profit_margin_percentage`,
  1 AS `flag_has_unpaid_receivable`,
  1 AS `flag_has_unpaid_payable`,
  1 AS `visual_status_badge` */;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_project_financial_summary`
--

/*!50001 DROP VIEW IF EXISTS `v_project_financial_summary`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */

/*!50001 VIEW `v_project_financial_summary` AS select `p`.`id` AS `project_id`,`p`.`project_code` AS `project_code`,`p`.`project_name` AS `project_name`,`p`.`client_name` AS `client_name`,`p`.`client_phone` AS `client_phone`,`p`.`total_contract_value` AS `total_contract_value`,`p`.`status` AS `project_status`,`p`.`start_date` AS `start_date`,`p`.`deadline_date` AS `deadline_date`,`p`.`notes` AS `notes`,coalesce(`cp`.`total_paid_client`,0.00) AS `total_paid_by_client`,`p`.`total_contract_value` - coalesce(`cp`.`total_paid_client`,0.00) AS `client_receivable_remaining`,coalesce(`tm`.`total_team_honor`,0.00) AS `total_agreed_team_honor`,coalesce(`tm`.`total_paid_team`,0.00) AS `total_disbursed_to_team`,coalesce(`tm`.`total_team_honor`,0.00) - coalesce(`tm`.`total_paid_team`,0.00) AS `team_payable_remaining`,coalesce(`cp`.`total_paid_client`,0.00) - coalesce(`tm`.`total_paid_team`,0.00) AS `net_cash_in_hand`,`p`.`total_contract_value` - coalesce(`tm`.`total_team_honor`,0.00) AS `projected_net_profit`,case when `p`.`total_contract_value` > 0 then round((`p`.`total_contract_value` - coalesce(`tm`.`total_team_honor`,0.00)) / `p`.`total_contract_value` * 100,2) else 0.00 end AS `profit_margin_percentage`,case when `p`.`total_contract_value` - coalesce(`cp`.`total_paid_client`,0.00) > 0 then 1 else 0 end AS `flag_has_unpaid_receivable`,case when coalesce(`tm`.`total_team_honor`,0.00) - coalesce(`tm`.`total_paid_team`,0.00) > 0 then 1 else 0 end AS `flag_has_unpaid_payable`,case when `p`.`total_contract_value` - coalesce(`cp`.`total_paid_client`,0.00) <= 0 and coalesce(`tm`.`total_team_honor`,0.00) - coalesce(`tm`.`total_paid_team`,0.00) <= 0 then 'GREEN_SETTLED' when `p`.`total_contract_value` - coalesce(`cp`.`total_paid_client`,0.00) > 0 and coalesce(`tm`.`total_team_honor`,0.00) - coalesce(`tm`.`total_paid_team`,0.00) > 0 then 'RED_AND_YELLOW_PENDING' when `p`.`total_contract_value` - coalesce(`cp`.`total_paid_client`,0.00) > 0 then 'RED_RECEIVABLE_PENDING' else 'YELLOW_TEAM_PENDING' end AS `visual_status_badge` from ((`projects` `p` left join (select `client_payments`.`project_id` AS `project_id`,sum(`client_payments`.`amount_paid`) AS `total_paid_client` from `client_payments` group by `client_payments`.`project_id`) `cp` on(`cp`.`project_id` = `p`.`id`)) left join (select `ptm`.`project_id` AS `project_id`,sum(`ptm`.`agreed_honor`) AS `total_team_honor`,sum(coalesce(`tp_sub`.`total_paid_member`,0.00)) AS `total_paid_team` from (`project_team_members` `ptm` left join (select `team_payments`.`project_team_member_id` AS `project_team_member_id`,sum(`team_payments`.`amount_paid`) AS `total_paid_member` from `team_payments` group by `team_payments`.`project_team_member_id`) `tp_sub` on(`tp_sub`.`project_team_member_id` = `ptm`.`id`)) group by `ptm`.`project_id`) `tm` on(`tm`.`project_id` = `p`.`id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-02 15:05:07
