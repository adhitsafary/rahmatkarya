<?php
// =====================================================================
// AUTH LOGIN HANDLER: ProCash Modern Filament React Admin Panel
// Handles POST authentication requests from the React SPA (apiLogin)
// and redirects GET browser requests directly to index.html.
// Backup of legacy page preserved at: _backup_old_theme/login.php
// =====================================================================

require_once __DIR__ . '/auth.php';

// Handle standard or AJAX/Fetch POST submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Support both application/x-www-form-urlencoded and JSON payload
    $rawInput = file_get_contents('php://input');
    $jsonData = json_decode($rawInput, true);

    $identifier = $_POST['identifier'] ?? ($jsonData['identifier'] ?? '');
    $password = $_POST['password'] ?? ($jsonData['password'] ?? '');
    $remember = !empty($_POST['remember']) || !empty($jsonData['remember']);

    $result = loginUser($identifier, $password, $remember);

    $isJsonExpected = (isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json'))
                   || (isset($_SERVER['CONTENT_TYPE']) && str_contains($_SERVER['CONTENT_TYPE'], 'application/json'));

    if ($isJsonExpected) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($result);
        exit;
    }

    if ($result['success']) {
        $target = ($result['user']['role'] === 'CLIENT') ? 'client.php' : 'index.html';
        header("Location: " . $target);
        exit;
    } else {
        header("Location: index.html?error=" . urlencode($result['message']));
        exit;
    }
}

// Redirect all GET traffic to the modern React SPA
header("Location: index.html");
exit;
