<?php
// api/php/utils.php

function set_cors_headers() {
    // IMPORTANT: In production, replace '*' with your specific frontend domain for security.
    // Example: header("Access-Control-Allow-Origin: https://your-nextjs-app.com");
    header("Access-Control-Allow-Origin: http://localhost:3000"); // For local Next.js dev
    // If your Next.js app runs on a different port or domain during development, adjust accordingly.
    
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-User-ID, X-Requested-With");
    // Allow credentials (cookies)
    header("Access-Control-Allow-Credentials: true");
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
}

function get_current_user_id() {
    if (session_status() == PHP_SESSION_NONE) {
        session_start([
            'cookie_secure' => true,
            'cookie_httponly' => true,
            'cookie_samesite' => 'Lax'
        ]);
    }
    return $_SESSION['user_id'] ?? null;
}
?>
