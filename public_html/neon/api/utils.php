<?php
// api/utils.php

// IMPORTANT: Suppress errors from being output directly to the browser, which can break headers.
// In production, ensure PHP error logging is properly configured on the server.
error_reporting(0);
@ini_set('display_errors', 0);

// **IMPORTANT:**
// For development, add your Next.js development server's origin(s) here.
// For production, set this to your deployed Next.js application's domain.
$allowed_origins = [
    'http://localhost:3000', // Common local Next.js dev port
    'https://6000-idx-studio-1746177151292.cluster-htdgsbmflbdmov5xrjithceibm.cloudworkstations.dev', // Your IDX dev environment
    // Add your production frontend URL here once deployed, e.g., 'https://your-neon-shopping-app.com'
    // If your Next.js app is hosted on digitalfiroj.com, add that origin here too.
    // Example: 'https://digitalfiroj.com'
];

function set_cors_headers() {
    global $allowed_origins;
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    // Clear any previously set Access-Control-Allow-Origin headers to avoid conflicts
    header_remove("Access-Control-Allow-Origin");

    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: {$origin}");
        error_log("CORS: Origin '{$origin}' allowed.");
    } else {
        // If origin is not in the list, and it's not empty, log it.
        // For development, you might temporarily allow all if needed, but be specific for production.
        if (!empty($origin)) {
            error_log("CORS: Origin '{$origin}' NOT in allowed list: " . implode(', ', $allowed_origins) . ". If this is your frontend, add it to allowed_origins.");
            // To temporarily allow all origins for debugging (NOT FOR PRODUCTION):
            // header("Access-Control-Allow-Origin: *");
            // error_log("CORS DEBUG: Allowing all origins due to mismatch or empty origin. Request from: " . ($origin ?: "'' (empty)"));
        } else {
            // If origin is empty (e.g. direct browser access to PHP script), you might not need to set Allow-Origin or set it to your main domain.
            // For now, we will not set it if origin is empty to avoid issues with direct access vs CORS requests.
            error_log("CORS: No origin header present in request.");
        }
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    // Ensure all necessary headers are allowed, especially for authenticated requests or complex content types
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Cookie, X-User-ID, Cache-Control, Pragma, Expires, X-Csrf-Token");
    header("Access-Control-Allow-Credentials: true"); // Crucial for sessions/cookies
    header("Access-Control-Max-Age: 86400"); // Cache preflight OPTIONS request for 1 day
}

function handle_options_request() {
    // This function must be called BEFORE any other output.
    set_cors_headers(); // Set CORS headers for all requests, including OPTIONS
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(204); // No Content - Standard for successful OPTIONS
        error_log("CORS: Responded to OPTIONS preflight request with 204 from origin: " . ($_SERVER['HTTP_ORIGIN'] ?? 'unknown'));
        exit; // Crucial: Stop script execution for OPTIONS requests
    }
}

function send_json_response($data, $status_code = 200) {
    if (!headers_sent()) {
        // Ensure CORS headers are set for every JSON response.
        // handle_options_request() should be called at the top of each API script,
        // which already calls set_cors_headers(). Calling it again here is redundant
        // if handle_options_request() is used correctly.
        // set_cors_headers(); // This line can be removed if handle_options_request() is always called first.
        http_response_code($status_code);
        header('Content-Type: application/json');
    } else {
        error_log("send_json_response: Headers already sent. Cannot set HTTP status code or Content-Type.");
    }
    echo json_encode($data);
    exit;
}

function start_secure_session() {
    if (session_status() == PHP_SESSION_NONE) {
        $is_https = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';

        $host = $_SERVER['HTTP_HOST'] ?? '';
        $cookie_domain = $host;
        if (strpos($host, ':') !== false) {
            $cookie_domain = substr($host, 0, strpos($host, ':'));
        }

        // Prepend . for subdomain cookies if not localhost and not an IP address
        if ($cookie_domain !== 'localhost' && !filter_var($cookie_domain, FILTER_VALIDATE_IP) && $cookie_domain !== '') {
             // Only prepend '.' if it's a domain name (not IP, not localhost, not empty)
            if (substr_count($cookie_domain, '.') >= 1) { // Basic check if it's likely a domain
                 $cookie_domain = '.' . $cookie_domain;
            }
        } else if (filter_var($host, FILTER_VALIDATE_IP) || $host === 'localhost') {
            // For IPs (like localhost or direct IP access), don't prepend '.'
            // For localhost, explicitly set domain to '' or 'localhost' depending on browser behavior.
            // Setting to '' often works best for localhost to ensure cookies are sent.
            $cookie_domain = ($host === 'localhost' || $host === '127.0.0.1') ? '' : $host;
        }


        session_set_cookie_params([
            'lifetime' => 28800, // 8 hours
            'path' => '/',
            'domain' => $cookie_domain, // Dynamic domain
            'secure' => $is_https,
            'httponly' => true,
            // SameSite=None requires Secure; Lax is a good default otherwise.
            // For cross-site requests with credentials, 'None' is needed.
            'samesite' => ($is_https) ? 'None' : 'Lax'
        ]);
        session_start();
        error_log("Session started with SameSite=" . (($is_https) ? 'None' : 'Lax') . " on domain=" . $cookie_domain . " for host=" . $host);
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

// JWT Functions (currently unused with PHP sessions but kept for potential future use)
define('JWT_SECRET', 'your-very-strong-and-secret-jwt-key-here-make-sure-its-long-and-random');

function create_jwt(array $payload, string $secret, int $expiration_time = 3600): string {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));

    $payload['iat'] = time();
    $payload['exp'] = time() + $expiration_time;
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode(json_encode($payload)));

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verify_jwt(string $jwt, string $secret): ?array {
    $tokenParts = explode('.', $jwt);
    if (count($tokenParts) !== 3) return null;

    $headerData = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
    $payloadData = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
    $signatureProvided = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[2])); // Changed from $tokenParts[3] to $tokenParts[2]

    if (!$headerData || !$payloadData) return null;

    $decodedHeader = json_decode($headerData, true);
    $decodedPayload = json_decode($payloadData, true);

    if (!$decodedHeader || !$decodedPayload || strtoupper($decodedHeader['alg'] ?? '') !== 'HS256') return null;

    $base64UrlHeaderForVerification = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($headerData));
    $base64UrlPayloadForVerification = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payloadData));

    $expectedSignatureData = hash_hmac('sha256', $base64UrlHeaderForVerification . "." . $base64UrlPayloadForVerification, $secret, true);
    // $expectedSignature = base64_encode($expectedSignatureData); // This was the original line
    $expectedSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($expectedSignatureData)); // Corrected to match JWT base64url encoding

    // Compare raw binary signature before base64 encoding for more reliability with hash_equals
    // $signatureProvidedBinary = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[2]));
    // if (!hash_equals($expectedSignatureData, $signatureProvidedBinary)) { ... }

    if (!hash_equals($expectedSignature, str_replace(['+', '/', '='], ['-', '_'], base64_encode($signatureProvided)))) { // Ensure provided signature is also base64url encoded for comparison
         error_log("JWT Signature Verification Failed. Expected: $expectedSignature, Provided Raw: " . $tokenParts[2] . ", Provided Decoded then Encoded for Compare: " . str_replace(['+', '/', '='], ['-', '_'], base64_encode($signatureProvided)));
        return null;
    }

    if (($decodedPayload['exp'] ?? 0) < time()) {
         error_log("JWT Token Expired.");
        return null;
    }

    return $decodedPayload;
}
?>
