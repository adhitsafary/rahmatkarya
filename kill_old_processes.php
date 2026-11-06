<?php
header('Content-Type: text/plain');
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=netdigi1_billing3', 'netdigi1_billing3', 'Billing3Pass2026Strong');
    $myId = $pdo->query("SELECT CONNECTION_ID()")->fetchColumn();
    $stmt = $pdo->query("SHOW FULL PROCESSLIST");
    echo "Current connection ID: $myId\n";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $id = $row['Id'];
        if ($id != $myId && $row['User'] == 'netdigi1_billing3') {
            echo "Killing thread $id (Time: {$row['Time']}, Command: {$row['Command']}, Info: " . substr($row['Info'] ?? '', 0, 50) . ")...\n";
            $pdo->query("KILL $id");
        }
    }
    echo "Done killing old threads.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
