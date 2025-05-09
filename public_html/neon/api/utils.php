
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
];

function set_cors_headers() {
    global $allowed_origins;
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    error_log("CORS Check: Received Origin: " . ($origin ?: "'' (empty)") . " | Allowed Origins: " . implode(', ', $allowed_origins));

    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header("Access-Control-Allow-Credentials: true");
        error_log("CORS Check: Origin '{$origin}' allowed. Sending Access-Control-Allow-Origin and Credentials.");
    } else {
        // If origin is not in the allowed list, do not send Allow-Origin for security.
        // The browser will block the request anyway.
        error_log("CORS Check: Origin '{$origin}' is NOT in the allowed list.");
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Cookie, X-User-ID, Cache-Control, Pragma, Expires");
    header("Access-Control-Max-Age: 86400"); // Cache preflight OPTIONS request for 1 day
}

function handle_options_request() {
    // This function must be called BEFORE any other output.
    if (isset($_SERVER['REQUEST_METHOD'])) { // Check if REQUEST_METHOD is set
      set_cors_headers(); // Set CORS headers for all requests, including OPTIONS
      if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
          http_response_code(204); // No Content - Standard for successful OPTIONS
          error_log("CORS Check: Responded to OPTIONS request with 204.");
          exit; // Crucial: Stop script execution for OPTIONS requests
      }
    } else {
      // REQUEST_METHOD not set, possibly not a web request. Log and proceed cautiously.
      error_log("CORS Check: REQUEST_METHOD not set. Skipping OPTIONS handling.");
      // You might still want to set some default headers if appropriate for non-HTTP contexts,
      // but for web API, REQUEST_METHOD should always be set.
    }
}

function send_json_response($data, $status_code = 200) {
    if (!headers_sent()) {
        // set_cors_headers(); // Already called by handle_options_request or at the start of API script
        http_response_code($status_code);
        header('Content-Type: application/json'); 
    }
    echo json_encode($data);
    exit; 
}

function start_secure_session() {
    if (session_status() == PHP_SESSION_NONE) {
        $is_https = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
        $cookie_domain = ""; // Auto-detect domain or set specific for production
        
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $is_localhost = (strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false);

        session_set_cookie_params([
            'lifetime' => 28800, 
            'path' => '/',
            'domain' => $cookie_domain, 
            'secure' => $is_https, 
            'httponly' => true, 
            'samesite' => ($is_https) ? 'None' : 'Lax' // Use None for cross-site HTTPS, Lax otherwise
        ]);
        session_start();
        error_log("Session started with SameSite=" . (($is_https) ? 'None' : 'Lax'));
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

// JWT Functions remain unchanged as they are not the primary cause of "Failed to fetch"
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
    $signatureProvided = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[2]));

    if (!$headerData || !$payloadData) return null; 

    $decodedHeader = json_decode($headerData, true);
    $decodedPayload = json_decode($payloadData, true);

    if (!$decodedHeader || !$decodedPayload || strtoupper($decodedHeader['alg'] ?? '') !== 'HS256') return null;
    
    $base64UrlHeaderForVerification = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($headerData));
    $base64UrlPayloadForVerification = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payloadData));

    $expectedSignature = hash_hmac('sha256', $base64UrlHeaderForVerification . "." . $base64UrlPayloadForVerification, $secret, true);
    
    if (!hash_equals($expectedSignature, $signatureProvided)) {
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

    