<?php
// api/auth/logout.php

// IMPORTANT: Suppress errors from being output directly to the browser, which can break headers.
error_reporting(0);
@ini_set('display_errors', 0);

require_once '../utils.php';
handle_options_request(); // Must be called before any output

start_secure_session();

$_SESSION = array();

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
