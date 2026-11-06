<?php
require_once __DIR__ . '/../config/db.php';

try {
    $pdo = Database::getConnection();

    // 1. Create users table if not exists
    $sql = "CREATE TABLE IF NOT EXISTS `users` (
        `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL COMMENT 'Nama Lengkap Pengguna',
        `username` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Username untuk login',
        `email` VARCHAR(191) NOT NULL UNIQUE COMMENT 'Email pengguna',
        `password` VARCHAR(255) NOT NULL COMMENT 'Bcrypt Hashed Password',
        `role` ENUM('ADMIN', 'FINANCE', 'VIEWER') NOT NULL DEFAULT 'ADMIN',
        `avatar` VARCHAR(255) NULL,
        `last_login` TIMESTAMP NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_users_username` (`username`),
        INDEX `idx_users_email` (`email`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sql);

    // Update existing user 1
    $pdo->exec("UPDATE users SET name = 'Administrator' WHERE id = 1");
    // Update existing user 2
    $pdo->exec("UPDATE users SET name = 'Finance Manager', username = 'finance', email = 'finance@procash.local' WHERE id = 2");

    echo "Users sanitized.\n";
    $stmtUsers = $pdo->query("SELECT id, name, username, email, role FROM users");
    print_r($stmtUsers->fetchAll(PDO::FETCH_ASSOC));

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
