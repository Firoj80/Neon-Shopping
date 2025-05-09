
<?php
// api/auth/logout.php
require_once '../utils.php'; 

handle_options_request(); // Must be called before any output
set_cors_headers();       // Must be called before any output

start_secure_session(); // Ensure session is started before trying to destroy

// Unset all of the session variables.
$_SESSION = array();

// If it's desired to kill the session, also delete the session cookie.
// Note: This will destroy the session, and not just the session data!
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Finally, destroy the session.
session_destroy();

send_json_response(['success' => true, 'message' => 'Logged out successfully.']);
?>
