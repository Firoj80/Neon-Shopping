<?php
// api/php/auth/logout.php
require_once '../utils.php';

handle_options_request();
set_cors_headers();

if (session_status() == PHP_SESSION_NONE) {
    session_start([
        'cookie_secure' => true,
        'cookie_httponly' => true,
        'cookie_samesite' => 'Lax'
    ]);
}

$_SESSION = array(); // Unset all session variables

if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

session_destroy();

send_json_response(['success' => true, 'message' => 'Logged out successfully.']);
?>
