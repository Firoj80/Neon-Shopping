
<?php
// api/utils.php

// **IMPORTANT:** 
// For development, add your Next.js development server's origin(s) here.
// For production, set this to your deployed Next.js application's domain.
$allowed_origins = [
    'http://localhost:3000', // Common local Next.js dev port
    'https://6000-idx-studio-1746177151292.cluster-htdgsbmflbdmov5xrjithceibm.cloudworkstations.dev', // Your IDX dev environment
    // Add your production frontend URL here once deployed, e.g., 'https://your-neon-shopping-app.com'
    // If your Next.js app is also hosted on digitalfiroj.com (e.g., a subdomain or different path), add that origin too.
    // Example: 'https://app.digitalfiroj.com' or 'https://digitalfiroj.com' if Next.js is at the root
];

function set_cors_headers() {
    global $allowed_origins;
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    // Log the received origin and allowed origins for debugging
    error_log("CORS Check: Received Origin: " . $origin . " | Allowed Origins: " . implode(', ', $allowed_origins));

    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header("Access-Control-Allow-Credentials: true"); // Crucial for credentialed requests
        error_log("CORS Check: Origin '{$origin}' allowed and credentials header sent.");
    } else {
        // If the origin is not in the allowed list, and it's not an empty origin (e.g. server-side script)
        // it's important NOT to send Access-Control-Allow-Credentials: true with a wildcard or different origin.
        // The browser will block the request if Access-Control-Allow-Origin is not set or doesn't match.
        error_log("CORS Check: Origin '{$origin}' is NOT in the allowed list. No Access-Control-Allow-Origin header will be sent from this block for this request if it's not an OPTIONS request.");
        // To be safe, don't send any Access-Control-Allow-Origin if not matched,
        // or send a specific deny if your server setup allows (though usually not sending is sufficient for browser to block).
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    // Added more common headers that might be sent by the client or needed by the server.
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Cookie, X-User-ID, Cache-Control, Pragma, Expires");
    // header("Access-Control-Max-Age: 86400"); // Optional: Cache preflight requests for 1 day
}

function handle_options_request() {
    // Set CORS headers for all requests, including OPTIONS, BEFORE any other output.
    set_cors_headers(); 
    
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(204); // No Content - Standard for successful OPTIONS
        exit;
    }
}

// send_json_response should be called AFTER potential session starts or any other logic,
// but it is good that it also ensures CORS headers are set one last time if not already.
// However, for preflight OPTIONS requests, handle_options_request should be the one exiting.
function send_json_response($data, $status_code = 200) {
    // If headers haven't been sent yet (e.g. not an OPTIONS request that exited), set them.
    if (!headers_sent()) {
        set_cors_headers(); 
    }
    
    http_response_code($status_code);
    // Ensure Content-Type is set correctly for JSON responses
    header('Content-Type: application/json'); 
    echo json_encode($data);
    exit; // Crucial to stop script execution after sending JSON response
}

function start_secure_session() {
    if (session_status() == PHP_SESSION_NONE) {
        $is_https = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
        
        // For production, you'd set this to your actual domain, e.g., ".digitalfiroj.com"
        // For local development, empty string or specific localhost domain.
        $cookie_domain = ""; 
        
        // Determine if running on localhost for SameSite=None compatibility issues with Secure flag
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $is_localhost = (strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false);

        session_set_cookie_params([
            'lifetime' => 28800, // 8 hours (example)
            'path' => '/',
            'domain' => $cookie_domain, 
            'secure' => $is_https, // Send cookie only over HTTPS
            'httponly' => true, // Prevent JavaScript access to the session cookie
            // SameSite=None requires Secure; Lax is a good default for security.
            // For local development over HTTP, 'Lax' is often better if Secure is false.
            // If developing locally over HTTPS and testing cross-site, 'None' with Secure might be needed.
            'samesite' => ($is_https && !$is_localhost) ? 'None' : 'Lax' 
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
        send_json_response(['success' => false, 'message' => 'Authentication required. Please log in.'], 401);
    }
    return $user_id;
}

// Basic input sanitation. For more complex scenarios, consider libraries or more robust validation.
function sanitize_input($data) {
    if (is_array($data)) {
        return array_map('sanitize_input', $data);
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

// --- JWT Functions (Example, not fully integrated or used by default with PHP sessions) ---
// For production, consider using a robust JWT library like firebase/php-jwt
// define('JWT_SECRET', 'your-very-strong-and-secret-jwt-key-here-make-sure-its-long-and-random'); 

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
    if (count($tokenParts) !== 3) return null; // Invalid token format

    // Decode URL-safe base64 strings
    $headerData = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
    $payloadData = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
    $signatureProvided = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[2]));


    if (!$headerData || !$payloadData) return null; // Failed to decode

    $decodedHeader = json_decode($headerData, true);
    $decodedPayload = json_decode($payloadData, true);

    if (!$decodedHeader || !$decodedPayload || strtoupper($decodedHeader['alg'] ?? '') !== 'HS256') return null;
    
    // Re-encode the original header and payload strings for signature verification
    // This is crucial because PHP's json_encode might reorder keys or change spacing
    $base64UrlHeaderForVerification = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($headerData));
    $base64UrlPayloadForVerification = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payloadData));

    $expectedSignature = hash_hmac('sha256', $base64UrlHeaderForVerification . "." . $base64UrlPayloadForVerification, $secret, true);
    
    if (!hash_equals($expectedSignature, $signatureProvided)) {
         error_log("JWT Signature Verification Failed."); // Log this for debugging
        return null; // Signature verification failed
    }

    if (($decodedPayload['exp'] ?? 0) < time()) {
         error_log("JWT Token Expired."); // Log this for debugging
        return null; // Token expired
    }

    return $decodedPayload;
}

?>

    