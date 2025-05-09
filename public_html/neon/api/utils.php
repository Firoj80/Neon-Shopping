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

    // TEMPORARY FOR DEBUGGING - ALLOW ALL ORIGINS
    // IMPORTANT: Revert this for production and use the in_array check below.
    header("Access-Control-Allow-Origin: *");
    error_log("CORS DEBUG: Allowing all origins. Request from: " . ($origin ?: "'' (empty)"));
    // END TEMPORARY DEBUGGING

    /*
    // PRODUCTION CORS (Uncomment and use this for production after debugging)
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: {$origin}");
        error_log("CORS: Origin '{$origin}' allowed.");
    } else {
        error_log("CORS: Origin '{$origin}' NOT in allowed list: " . implode(', ', $allowed_origins) . ". If this is your frontend, add it to allowed_origins.");
    }
    */

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    // Ensure all necessary headers are allowed, especially for authenticated requests or complex content types
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Cookie, X-User-ID, Cache-Control, Pragma, Expires, X-Csrf-Token");
    header("Access-Control-Allow-Credentials: true"); // Crucial for sessions/cookies
    header("Access-Control-Max-Age: 86400"); // Cache preflight OPTIONS request for 1 day
}

function handle_options_request() {
    // This function must be called BEFORE any other output.
    if (isset($_SERVER['REQUEST_METHOD'])) { 
      set_cors_headers(); // Set CORS headers for all requests, including OPTIONS
      if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
          http_response_code(204); // No Content - Standard for successful OPTIONS
          error_log("CORS: Responded to OPTIONS preflight request with 204 from origin: " . ($_SERVER['HTTP_ORIGIN'] ?? 'unknown'));
          exit; // Crucial: Stop script execution for OPTIONS requests
      }
    } else {
      // REQUEST_METHOD not set, possibly not a web request. Log and proceed cautiously.
      error_log("CORS Warning: REQUEST_METHOD not set. Skipping OPTIONS handling logic.");
    }
}

function send_json_response($data, $status_code = 200) {
    if (!headers_sent()) {
        // Ensure CORS headers are set for every JSON response,
        // handle_options_request might have already set them for OPTIONS or if called at script start.
        // Calling it again here ensures they are set if not an OPTIONS request and not called earlier.
        // However, it's better to call handle_options_request() at the top of each API script.
        // For safety, we can call set_cors_headers() if handle_options_request wasn't the entry point.
        // if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') { // Avoid double setting if OPTIONS already handled it.
        //    set_cors_headers();
        // }
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
        
        // More robust domain detection for cookie_domain
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $cookie_domain = $host; // Default to current host
        // Remove port if present for broader cookie scope on the domain
        if (strpos($host, ':') !== false) {
            $cookie_domain = substr($host, 0, strpos($host, ':'));
        }
        // Prepend . for subdomain cookies if not localhost
        if ($cookie_domain !== 'localhost' && !filter_var($cookie_domain, FILTER_VALIDATE_IP)) {
            $cookie_domain = '.' . $cookie_domain;
        } else if (filter_var($cookie_domain, FILTER_VALIDATE_IP)) {
            // For IPs (like localhost or direct IP access), don't prepend '.'
             $cookie_domain = $host; // Use full host including port if it's an IP
        }


        session_set_cookie_params([
            'lifetime' => 28800, 
            'path' => '/',
            'domain' => $cookie_domain, 
            'secure' => $is_https, 
            'httponly' => true, 
            // SameSite=None requires Secure; Lax is a good default otherwise.
            // For cross-site requests with credentials, 'None' is needed.
            'samesite' => ($is_https) ? 'None' : 'Lax' 
        ]);
        session_start();
        error_log("Session started with SameSite=" . (($is_https) ? 'None' : 'Lax') . " on domain=" . $cookie_domain);
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