<?php
header('Content-Type: text/plain');
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=netdigi1_billing3', 'netdigi1_billing3', 'Billing3Pass2026Strong');
    $stmt = $pdo->query("SHOW FULL PROCESSLIST");
    echo "Processes:\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "ID: {$row['Id']} | User: {$row['User']} | Time: {$row['Time']} | State: {$row['State']} | Info: {$row['Info']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
