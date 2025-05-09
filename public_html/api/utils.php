
<?php
// api/utils.php

// **IMPORTANT:** 
// For development, set this to your Next.js development server's origin.
// For production, set this to your deployed Next.js application's domain.
// Example for development: define('ALLOWED_ORIGIN', 'http://localhost:3000');
// Example from error log: define('ALLOWED_ORIGIN', 'https://6000-idx-studio-1746177151292.cluster-htdgsbmflbdmov5xrjithceibm.cloudworkstations.dev');

// Define multiple allowed origins if necessary, e.g., for dev and prod
$allowed_origins = [
    'http://localhost:3000', // Common local Next.js dev port
    'https://6000-idx-studio-1746177151292.cluster-htdgsbmflbdmov5xrjithceibm.cloudworkstations.dev', // Your IDX dev environment
    // Add your production frontend URL here once deployed, e.g., 'https://your-neon-shopping.com'
    // Add the domain your Next.js app will be hosted on for production
    // 'https://your-production-domain.com' 
];

define('JWT_SECRET', 'your-very-strong-and-secret-jwt-key-here'); // CHANGE THIS! Ensure it's strong and kept secret.

function set_cors_headers() {
    global $allowed_origins;
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: {$origin}");
    } else {
        // If the origin is not in the allowed list, you might choose to not send the header,
        // which will result in a CORS error on the client, or send a specific one like your main domain.
        // For now, we are only allowing specified origins.
        // error_log("CORS: Origin '{$origin}' not in allowed list: " . implode(', ', $allowed_origins));
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    // Ensure all necessary headers are allowed, especially for authentication or custom client headers
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-ID, Cookie");
    header("Access-Control-Allow-Credentials: true"); // Crucial for credentialed requests (cookies, sessions)
}

function handle_options_request() {
    // This must be called BEFORE any other output
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        set_cors_headers(); // Ensure CORS headers are sent for OPTIONS preflight
        http_response_code(204); // No Content - Standard for successful OPTIONS
        exit; // Terminate script execution after sending preflight response
    }
}

function send_json_response($data, $status_code = 200) {
    // It's good practice to call set_cors_headers() early in your script execution path
    // or ensure handle_options_request() which calls it, is always invoked first for all request types.
    if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') { // Avoid double-sending for OPTIONS
        set_cors_headers();
    }
    
    http_response_code($status_code);
    header('Content-Type: application/json'); // Explicitly set Content-Type
    echo json_encode($data);
    exit; // Ensure script termination after sending response
}

function start_secure_session() {
    if (session_status() == PHP_SESSION_NONE) {
        // Determine if running over HTTPS
        $is_https = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
        
        session_set_cookie_params([
            'lifetime' => 28800, // 8 hours example, should match gc_maxlifetime
            'path' => '/',
            // 'domain' => ".yourdomain.com", // For production, set your domain, ensure leading dot for subdomains
            'secure' => $is_https, // True if HTTPS, false otherwise
            'httponly' => true,    // Prevents client-side script access to the cookie
            'samesite' => $is_https ? 'None' : 'Lax' // 'None' requires 'Secure'; 'Lax' is a good default
        ]);
        session_start();
    }
}


function get_current_user_id() {
    start_secure_session(); // Ensures session is started
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
