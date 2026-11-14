<?php
// Test creating a demo client user bound to Project 1 (Proyek Jonggol)
require_once __DIR__ . '/config/db.php';
$pdo = Database::getConnection();

try {
    $username = 'client.jonggol';
    $email = 'client.jonggol@rahmatkarya.com';
    $password = password_hash('client123', PASSWORD_BCRYPT);
    $name = 'Bpk. Klien Jonggol';
    $role = 'CLIENT';
    $projectId = 1;

    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    $existing = $stmt->fetch();

    if ($existing) {
        $stmtUpdate = $pdo->prepare("UPDATE users SET password = ?, role = ?, client_project_id = ?, name = ? WHERE id = ?");
        $stmtUpdate->execute([$password, $role, $projectId, $name, $existing['id']]);
        echo "Updated client user: {$username} (ID: {$existing['id']}) assigned to project {$projectId}\n";
    } else {
        $stmtInsert = $pdo->prepare("INSERT INTO users (name, username, email, password, role, client_project_id) VALUES (?, ?, ?, ?, ?, ?)");
        $stmtInsert->execute([$name, $username, $email, $password, $role, $projectId]);
        $newId = $pdo->lastInsertId();
        echo "Created client user: {$username} (ID: {$newId}) assigned to project {$projectId}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
