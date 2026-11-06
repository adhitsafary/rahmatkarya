<?php
header('Content-Type: text/plain');
$pdo = new PDO("mysql:host=127.0.0.1;dbname=netdigi1_billing3", "netdigi1_billing3", "Billing3Pass2026Strong");
$tables = $pdo->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'netdigi1_billing3'")->fetchAll(PDO::FETCH_COLUMN);
echo "Tables currently imported: " . count($tables) . "\n";
print_r(array_slice($tables, 0, 15));
