<?php
header('Content-Type: text/plain');
try {
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=netdigi1_billing3', 'netdigi1_billing3', 'Billing3Pass2026Strong');
    echo "MySQL Server version: " . $pdo->query("SELECT VERSION()")->fetchColumn() . "\n";
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . "\n";
}
