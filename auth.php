<?php
// =====================================================================
// AUTHENTICATION HELPER & SESSION MANAGER: ProCash Tracker
// =====================================================================

if (session_status() === PHP_SESSION_NONE) {
    // Configure secure session settings
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    session_start();
}

require_once __DIR__ . '/config/db.php';

/**
 * Check if current user is logged in
 */
function isLoggedIn(): bool {
    return !empty($_SESSION['user_id']);
}

/**
 * Get currently authenticated user data
 */
function getCurrentUser(): ?array {
    if (!isLoggedIn()) {
        return null;
    }
    return [
        'id' => $_SESSION['user_id'],
        'name' => $_SESSION['user_name'] ?? 'User',
        'username' => $_SESSION['user_username'] ?? '',
        'email' => $_SESSION['user_email'] ?? '',
        'role' => $_SESSION['user_role'] ?? 'ADMIN',
        'client_project_id' => $_SESSION['client_project_id'] ?? null
    ];
}

/**
 * Check if current user has ADMIN role
 */
function isAdmin(): bool {
    return isLoggedIn() && (($_SESSION['user_role'] ?? '') === 'ADMIN');
}

/**
 * Check if current user has CLIENT role
 */
function isClient(): bool {
    return isLoggedIn() && (($_SESSION['user_role'] ?? '') === 'CLIENT');
}

/**
 * Check if current user has write/edit permissions (ADMIN or FINANCE, but not VIEWER or CLIENT)
 */
function canEdit(): bool {
    if (!isLoggedIn()) return false;
    $role = $_SESSION['user_role'] ?? 'VIEWER';
    return in_array($role, ['ADMIN', 'FINANCE']);
}

/**
 * Enforce write/edit access (Reject VIEWER role)
 */
function requireCanEdit(bool $jsonApi = false): void {
    checkAuth($jsonApi);
    if (!canEdit()) {
        if ($jsonApi || (!empty($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json'))) {
            http_response_code(403);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'success' => false,
                'message' => 'Akses ditolak. Akun Viewer hanya memiliki hak baca (Read-only) dan tidak diizinkan mengubah data.',
                'forbidden' => true
            ]);
            exit;
        }
        header("Location: index.php?error=unauthorized_viewer");
        exit;
    }
}

/**
 * Enforce administrator access
 */
function requireAdmin(bool $jsonApi = false): void {
    checkAuth($jsonApi);
    if (!isAdmin()) {
        if ($jsonApi || (!empty($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json'))) {
            http_response_code(403);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'success' => false,
                'message' => 'Akses ditolak. Fitur ini hanya dapat diakses oleh Administrator.',
                'forbidden' => true
            ]);
            exit;
        }
        header("Location: index.php?error=unauthorized_admin");
        exit;
    }
}

/**
 * Enforce authentication: Redirect to login or return 401 JSON
 */
function checkAuth(bool $jsonApi = false): void {
    if (!isLoggedIn()) {
        if ($jsonApi || (!empty($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json'))) {
            http_response_code(401);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'success' => false,
                'message' => 'Sesi login telah berakhir atau belum terautentikasi.',
                'unauthorized' => true
            ]);
            exit;
        }

        // Save current requested URL to return after login
        $currentUri = $_SERVER['REQUEST_URI'] ?? 'index.php';
        header("Location: login.php?redirect=" . urlencode($currentUri));
        exit;
    }
}

/**
 * Attempt to login with username/email and password
 */
function loginUser(string $identifier, string $password, bool $remember = false): array {
    $identifier = trim($identifier);
    $password = trim($password);

    if (empty($identifier) || empty($password)) {
        return [
            'success' => false,
            'message' => 'Username/email dan kata sandi wajib diisi.'
        ];
    }

    $pdo = Database::getConnection();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1");
    $stmt->execute([$identifier, $identifier]);
    $user = $stmt->fetch();

    if (!$user) {
        return [
            'success' => false,
            'message' => 'Akun tidak ditemukan. Periksa kembali username atau email Anda.'
        ];
    }

    if (!password_verify($password, $user['password'])) {
        return [
            'success' => false,
            'message' => 'Kata sandi salah. Silakan coba lagi.'
        ];
    }

    // Login success: Prevent session fixation
    session_regenerate_id(true);

    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_username'] = $user['username'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_role'] = $user['role'];
    $_SESSION['client_project_id'] = !empty($user['client_project_id']) ? (int)$user['client_project_id'] : null;

    // Update last login timestamp
    $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $updateStmt->execute([$user['id']]);

    return [
        'success' => true,
        'user' => [
            'id' => (int)$user['id'],
            'name' => $user['name'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'client_project_id' => $_SESSION['client_project_id']
        ]
    ];
}

/**
 * Terminate user session
 */
function logoutUser(): void {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }
    session_destroy();
}
