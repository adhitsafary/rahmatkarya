<?php
// =====================================================================
// LOGOUT HANDLER: ProCash Modern Filament React Admin Panel
// =====================================================================

require_once __DIR__ . '/auth.php';

logoutUser();

$isJsonExpected = (isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json'));

if ($isJsonExpected) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => true, 'message' => 'Berhasil keluar']);
    exit;
}

header("Location: index.html?logged_out=1");
exit;
