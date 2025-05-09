
<?php
// api/utils.php

// **IMPORTANT:** In production, replace '*' with your specific frontend domain.
// Example: header("Access-Control-Allow-Origin: https://your-nextjs-app.com");
define('ALLOWED_ORIGIN', 'http://localhost:3000'); // For local Next.js dev, update for production
define('JWT_SECRET', 'your-very-strong-and-secret-jwt-key-here'); // CHANGE THIS!

function set_cors_headers() {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        $origin = $_SERVER['HTTP_ORIGIN'];
        // You might want to have a list of allowed origins if you have multiple frontends
        if ($origin === ALLOWED_ORIGIN || ALLOWED_ORIGIN === '*') {
             header("Access-Control-Allow-Origin: {$origin}");
        }
    } else {
        // Fallback for requests without HTTP_ORIGIN (e.g. same-origin or server-to-server)
        // If you strictly want to allow only specific origins, you might remove this.
        header("Access-Control-Allow-Origin: *");
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-User-ID, X-Requested-With");
    header("Access-Control-Allow-Credentials: true"); // Important for cookies/sessions
}

function handle_options_request() {
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        set_cors_headers();
        http_response_code(204); // No Content
        exit;
    }
}

function send_json_response($data, $status_code = 200) {
    http_response_code($status_code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit; // Ensure script termination after sending response
}

function start_secure_session() {
    if (session_status() == PHP_SESSION_NONE) {
        // More secure session settings
        ini_set('session.cookie_httponly', 1);
        ini_set('session.cookie_secure', 1); // Ensure this is 1 if using HTTPS
        ini_set('session.use_only_cookies', 1);
        ini_set('session.gc_maxlifetime', 1800); // 30 minutes
        session_set_cookie_params([
            'lifetime' => 1800,
            'path' => '/',
            'domain' => "", // Set your domain for production
            'secure' => true, // Set to true if using HTTPS
            'httponly' => true,
            'samesite' => 'Lax' // Or 'Strict' for more security
        ]);
        session_start();
    }
}

function get_current_user_id() {
    start_secure_session();
    return $_SESSION['user_id'] ?? null;
}

function ensure_authenticated() {
    $user_id = get_current_user_id();
    if (!$user_id) {
        send_json_response(['success' => false, 'message' => 'Authentication required.'], 401);
    }
    return $user_id;
}

// Basic input sanitization (expand as needed)
function sanitize_input($data) {
    if (is_array($data)) {
        return array_map('sanitize_input', $data);
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}
?>
