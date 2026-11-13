<?php
require_once __DIR__ . '/config_paths.php';
require_once __DIR__ . '/../config/db.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function current_user(): ?array {
    return $_SESSION['user'] ?? null;
}

function is_logged_in(): bool {
    return isset($_SESSION['user']);
}

function require_role(string $role): void {
    if (!is_logged_in() || $_SESSION['user']['role'] !== $role) {
        header('Location: ' . base_url('login.php'));
        exit;
    }
}

function require_login(): void {
    if (!is_logged_in()) {
        header('Location: ' . base_url('login.php'));
        exit;
    }
}

/** Base URL helper so links work regardless of subfolder depth. */
function base_url(string $path = ''): string {
    // Adjust BASE_PATH in includes/config_paths.php if you deploy in a subfolder.
    return rtrim(BASE_PATH, '/') . '/' . ltrim($path, '/');
}

function login_user(array $userRow): void {
    $_SESSION['user'] = [
        'user_id' => $userRow['user_id'],
        'name'    => $userRow['name'],
        'role'    => $userRow['role'],
    ];
}

function logout_user(): void {
    $_SESSION = [];
    session_destroy();
}

/** Returns the pharmacy row owned by the currently logged-in pharmacy_admin, or null. */
function current_pharmacy(): ?array {
    if (!is_logged_in() || $_SESSION['user']['role'] !== 'pharmacy_admin') {
        return null;
    }
    $stmt = get_db()->prepare('SELECT * FROM pharmacies WHERE owner_user_id = ?');
    $stmt->execute([$_SESSION['user']['user_id']]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function flash(string $key, ?string $message = null) {
    if ($message !== null) {
        $_SESSION['flash'][$key] = $message;
        return null;
    }
    if (isset($_SESSION['flash'][$key])) {
        $msg = $_SESSION['flash'][$key];
        unset($_SESSION['flash'][$key]);
        return $msg;
    }
    return null;
}

function h(string $str): string {
    return htmlspecialchars($str, ENT_QUOTES, 'UTF-8');
}
