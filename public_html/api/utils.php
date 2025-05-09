
<?php
// api/utils.php

// **IMPORTANT:** In production, replace '*' with your specific frontend domain.
// For local Next.js dev, it's usually http://localhost:3000 or similar.
// For your deployed frontend, it would be its actual domain.
define('ALLOWED_ORIGIN', '*'); // Allow all for now, CHANGE FOR PRODUCTION
define('JWT_SECRET', 'your-very-strong-and-secret-jwt-key-here'); // CHANGE THIS! Ensure it's strong and kept secret.

function set_cors_headers() {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        $origin = $_SERVER['HTTP_ORIGIN'];
        // If ALLOWED_ORIGIN is not '*', check if $origin is in a list of allowed origins
        if (ALLOWED_ORIGIN === '*' || $origin === ALLOWED_ORIGIN /* you might check against an array of allowed origins */) {
            header("Access-Control-Allow-Origin: {$origin}");
        } else {
            // Optionally, log or handle origins not explicitly allowed if not using '*'
            // For now, if not '*', we won't set the header, which will likely block.
            // Or, for stricter control where '*' is not desired even in dev for some reason:
            // header("Access-Control-Allow-Origin: " . (SOME_DEFAULT_OR_FALLBACK_IF_NOT_MATCHED));
            // But for testing, '*' is often simplest. If you have a fixed dev URL, use that.
        }
    } else {
        // Requests without an Origin header (e.g. same-origin, server-to-server, or some tools like Postman)
        // Generally, for browser-based AJAX, Origin will be present.
        // If you still want to allow these, and not set a specific origin:
        if (ALLOWED_ORIGIN === '*') { // Only allow * if explicitly set as such
             header("Access-Control-Allow-Origin: *");
        }
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    // Ensure all headers your frontend might send are listed here
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID"); // Added X-User-ID if used
    header("Access-Control-Allow-Credentials: true"); // Crucial for credentialed requests (cookies, sessions)
}

function handle_options_request() {
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        set_cors_headers(); // Ensure CORS headers are sent for OPTIONS preflight
        http_response_code(204); // No Content - Standard for successful OPTIONS
        exit;
    }
}

function send_json_response($data, $status_code = 200) {
    http_response_code($status_code);
    header('Content-Type: application/json'); // Explicitly set Content-Type
    echo json_encode($data);
    exit; // Ensure script termination after sending response
}

function start_secure_session() {
    if (session_status() == PHP_SESSION_NONE) {
        // More secure session settings
        ini_set('session.cookie_httponly', 1); 
        // For production, ensure 'session.cookie_secure' is 1 if using HTTPS.
        // For local dev over HTTP, this might need to be 0 or commented out if HTTPS isn't set up.
        $is_https = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
        ini_set('session.cookie_secure', $is_https ? 1 : 0); 
        ini_set('session.use_only_cookies', 1);
        ini_set('session.gc_maxlifetime', 28800); // 8 hours example
        session_set_cookie_params([
            'lifetime' => 28800, // Should match gc_maxlifetime
            'path' => '/',
            // 'domain' => ".yourdomain.com", // Set your domain for production, ensure leading dot for subdomains
            'secure' => $is_https, 
            'httponly' => true,
            'samesite' => 'Lax' // Or 'Strict' or 'None' (if 'None', 'Secure' must be true)
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
