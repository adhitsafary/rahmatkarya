<?php
header('Content-Type: application/json');
require_once __DIR__ . '/config/db.php';

try {
    $pdo = Database::getConnection();
    
    // Create app_settings table
    $sql = "CREATE TABLE IF NOT EXISTS app_settings (
        key_name VARCHAR(64) PRIMARY KEY,
        key_value LONGTEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $pdo->exec($sql);
    
    // Check if table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'app_settings'");
    $exists = $stmt->fetchColumn();
    
    echo json_encode([
        'success' => true,
        'message' => 'Tabel app_settings siap.',
        'table_exists' => !empty($exists)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
