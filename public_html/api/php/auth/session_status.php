<?php
// api/php/auth/session_status.php
require_once '../utils.php';

handle_options_request();
set_cors_headers(); // Ensure CORS is set for this endpoint

if (session_status() == PHP_SESSION_NONE) {
    session_start([
        'cookie_secure' => true,
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax'
    ]);
}

if (isset($_SESSION['user_id'])) {
    send_json_response([
        'isAuthenticated' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'name' => $_SESSION['user_name'] ?? 'User',
            'email' => $_SESSION['user_email'] ?? ''
        ]
    ]);
} else {
    send_json_response(['isAuthenticated' => false, 'user' => null]);
}
?>
