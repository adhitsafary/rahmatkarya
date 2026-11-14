<?php
// Migration: Add client_project_id to users and update role enum
require_once __DIR__ . '/config/db.php';
$pdo = Database::getConnection();

try {
    // 1. Check if client_project_id column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'client_project_id'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE users ADD COLUMN client_project_id INT(10) UNSIGNED DEFAULT NULL AFTER role");
        $pdo->exec("ALTER TABLE users ADD CONSTRAINT fk_users_client_project FOREIGN KEY (client_project_id) REFERENCES projects(id) ON DELETE SET NULL");
        echo "Column client_project_id added successfully.\n";
    } else {
        echo "Column client_project_id already exists.\n";
    }

    // 2. Check role enum in users
    $stmt = $pdo->query("SHOW COLUMNS FROM users LIKE 'role'");
    $col = $stmt->fetch();
    echo "Current role type: " . $col['Type'] . "\n";
    if (!str_contains($col['Type'], 'CLIENT')) {
        $pdo->exec("ALTER TABLE users MODIFY COLUMN role ENUM('ADMIN','FINANCE','VIEWER','CLIENT') NOT NULL DEFAULT 'VIEWER'");
        echo "Role ENUM updated to include CLIENT.\n";
    } else {
        echo "Role ENUM already includes CLIENT.\n";
    }

    echo "Migration completed successfully!\n";
} catch (Exception $e) {
    echo "Migration Error: " . $e->getMessage() . "\n";
}
