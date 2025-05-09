<?php
// api/utils.php

error_reporting(0); // Suppress direct error output
@ini_set('display_errors', 0); // Suppress direct error output

$allowed_origins = [
    'http://localhost:3000',
    // IMPORTANT: Replace with your deployed Next.js app's domain for production
    'https://6000-idx-studio-1746177151292.cluster-htdgsbmflbdmov5xrjithceibm.cloudworkstations.dev', 
    // Add your actual production frontend URL here if different
    // e.g., 'https://your-neon-shopping-app.com' 
];

define('JWT_SECRET', 'your-very-strong-and-secret-jwt-key-here-make-sure-its-long-and-random'); // CHANGE THIS!

function set_cors_headers() {
    global $allowed_origins;
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    header_remove("Access-Control-Allow-Origin"); // Clear previous to avoid duplicates

    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: {$origin}");
    } else {
        if (!empty($origin)) {
            // Log for debugging, but don't send the header if origin is not allowed
            // This will cause a CORS error on the client, which is correct behavior.
            error_log("CORS: Origin '{$origin}' NOT in allowed list: " . implode(', ', $allowed_origins));
        }
    }
    
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Cookie, X-User-ID, Cache-Control, Pragma, Expires, X-Csrf-Token");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400"); // Cache preflight OPTIONS request for 1 day
}

function handle_options_request() {
    set_cors_headers(); // Set headers for all requests, including OPTIONS
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(204); // No Content
        exit;
    }
}

function send_json_response($data, $status_code = 200) {
    if (!headers_sent()) {
        set_cors_headers(); // Ensure CORS headers are set for every JSON response
        http_response_code($status_code);
        header('Content-Type: application/json');
    }
    echo json_encode($data);
    exit; 
}

function start_secure_session() {
    if (session_status() == PHP_SESSION_NONE) {
        $is_https = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
        $host = $_SERVER['HTTP_HOST'] ?? '';
        
        // Determine cookie domain
        // For localhost, explicitly set domain to '' or 'localhost'.
        // For live domains, prepend '.' for subdomain compatibility.
        $cookie_domain = ''; // Default to empty string
        if ($host !== 'localhost' && $host !== '127.0.0.1' && !filter_var($host, FILTER_VALIDATE_IP)) {
            // It's likely a domain name, prepend '.' if it has at least one dot.
             if (substr_count($host, '.') >= 1) {
                 $cookie_domain = '.' . $host;
             } else {
                 $cookie_domain = $host; // For single-label domains if any (e.g. intranet)
             }
        } else if ($host === 'localhost' || $host === '127.0.0.1') {
            $cookie_domain = ''; // Or 'localhost', empty string often works best for localhost
        }


        session_set_cookie_params([
            'lifetime' => 28800, // 8 hours
            'path' => '/',
            'domain' => $cookie_domain, 
            'secure' => $is_https,
            'httponly' => true,
            'samesite' => ($is_https) ? 'None' : 'Lax' 
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
        send_json_response(['success' => false, 'message' => 'Authentication required. Please log in.'], 401);
    }
    return $user_id;
}

function sanitize_input($data) {
    if (is_array($data)) {
        return array_map('sanitize_input', $data);
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}


// --- JWT Functions (Example, using a simple approach without external libraries for this context) ---
// These are not currently used in the session-based authentication but kept for reference.
function create_jwt(array $payload, string $secret, int $expiration_time = 3600): string {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));

    $payload['iat'] = time(); // Issued at
    $payload['exp'] = time() + $expiration_time; // Expiration time
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verify_jwt(string $jwt, string $secret): ?array {
    $tokenParts = explode('.', $jwt);
    if (count($tokenParts) !== 3) {
        return null; 
    }

    $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
    $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
    $signatureProvidedDecoded = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[2]));


    $decodedHeader = json_decode($header, true);
    $decodedPayload = json_decode($payload, true);

    if (!$decodedHeader || !$decodedPayload) {
        return null; 
    }

    if (strtoupper($decodedHeader['alg'] ?? '') !== 'HS256') {
        return null; 
    }

    $base64UrlHeaderForVerification = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header)); 
    $base64UrlPayloadForVerification = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $expectedSignatureData = hash_hmac('sha256', $base64UrlHeaderForVerification . "." . $base64UrlPayloadForVerification, $secret, true);

    if (!hash_equals($expectedSignatureData, $signatureProvidedDecoded)) {
        error_log("JWT Signature Verification Failed.");
        return null; 
    }

    if (($decodedPayload['exp'] ?? 0) < time()) {
        error_log("JWT Token Expired.");
        return null; 
    }

    return $decodedPayload;
}

?>
