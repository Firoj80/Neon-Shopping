
<?php
// api/utils.php

// **IMPORTANT:** 
// For development, set this to your Next.js development server's origin.
// For production, set this to your deployed Next.js application's domain.
$allowed_origins = [
    'http://localhost:3000', // Common local Next.js dev port
    'https://6000-idx-studio-1746177151292.cluster-htdgsbmflbdmov5xrjithceibm.cloudworkstations.dev', // Your IDX dev environment
    // Add your production frontend URL here once deployed, e.g., 'https://your-neon-shopping.com'
];

// --- JWT Secret ---
// This secret is used to sign and verify JWTs for session management.
// Ensure this is a strong, unique secret and keep it secure.
// It MUST match the secret used in your Next.js middleware if you are also verifying JWTs there.
// For production, consider storing this in a secure environment variable outside of your codebase if possible.
define('JWT_SECRET', 'your-very-strong-and-secret-jwt-key-here-make-sure-its-long-and-random'); // CHANGE THIS!

function set_cors_headers() {
    global $allowed_origins;
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    // FOR DEBUGGING "Failed to fetch": Temporarily allow all origins.
    // REMOVE THIS AND UNCOMMENT THE BLOCK BELOW FOR PRODUCTION.
    header("Access-Control-Allow-Origin: *");

    // // PRODUCTION CORS (Commented out for debugging)
    // if (in_array($origin, $allowed_origins)) {
    //     header("Access-Control-Allow-Origin: {$origin}");
    // } else {
    //     // If the origin is not in the allowed list, you might choose to not send the header,
    //     // which will result in a CORS error on the client, or send a specific one like your main domain.
    //     // For now, we are only allowing specified origins.
    //     // error_log("CORS: Origin '{$origin}' not in allowed list: " . implode(', ', $allowed_origins));
    //     // For debugging, you could temporarily allow all origins here too, but it's better to fix the allowed_origins list.
    //     // header("Access-Control-Allow-Origin: *"); // TEMPORARY FOR DEBUGGING IF NEEDED
    // }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Cookie, X-User-ID"); // Ensure X-User-ID is allowed if you use it
    header("Access-Control-Allow-Credentials: true");
}

function handle_options_request() {
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        set_cors_headers(); // This will now use the modified (more permissive) CORS settings
        http_response_code(204); // No Content - Standard for successful OPTIONS
        exit;
    }
}

function send_json_response($data, $status_code = 200) {
    // Set CORS headers for all responses, not just OPTIONS preflight
    // This is important if the initial request (e.g. GET/POST) is the one failing due to CORS
    // after a preflight, or if it's a simple request without preflight.
    set_cors_headers(); 
    
    http_response_code($status_code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit; 
}

function start_secure_session() {
    if (session_status() == PHP_SESSION_NONE) {
        $is_https = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
        $cookie_domain = ""; // Set to your domain for production e.g., ".yourdomain.com"
        
        // Determine if running on localhost for SameSite=None compatibility
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $is_localhost = (strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false);

        session_set_cookie_params([
            'lifetime' => 28800, // 8 hours
            'path' => '/',
            'domain' => $cookie_domain,
            'secure' => $is_https,
            'httponly' => true,
            // SameSite=None requires Secure; Lax is a good default otherwise.
            // For local development over HTTP, 'Lax' is often better if Secure is false.
            'samesite' => ($is_https && !$is_localhost) ? 'None' : 'Lax'
        ]);
        session_start();
    }
}


function get_current_user_id() {
    start_secure_session();
    // If using JWT in cookies for session, you'd verify it here.
    // For simple PHP sessions:
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
// For production, consider using a robust JWT library like firebase/php-jwt

// IMPORTANT: The JWT functions provided below are basic examples.
// For a production environment, you should use a well-vetted JWT library
// like `firebase/php-jwt` for better security and more features.
// `composer require firebase/php-jwt`

/**
 * Creates a JWT token.
 * @param array $payload The data to include in the token.
 * @param string $secret The secret key to sign the token.
 * @param int $expiration_time Token validity duration in seconds.
 * @return string The generated JWT.
 */
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

/**
 * Verifies a JWT token and returns its payload.
 * @param string $jwt The token to verify.
 * @param string $secret The secret key used to sign the token.
 * @return array|null The payload if the token is valid and not expired, null otherwise.
 */
function verify_jwt(string $jwt, string $secret): ?array {
    $tokenParts = explode('.', $jwt);
    if (count($tokenParts) !== 3) {
        return null; // Invalid token format
    }

    $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
    $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
    $signatureProvided = str_replace(['-', '_'], ['+', '/'], $tokenParts[2]);

    $decodedHeader = json_decode($header, true);
    $decodedPayload = json_decode($payload, true);

    if (!$decodedHeader || !$decodedPayload) {
        return null; // Invalid JSON in token
    }

    if (strtoupper($decodedHeader['alg'] ?? '') !== 'HS256') {
        return null; // Unsupported algorithm
    }

    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header)); // Re-encode original header
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload)); // Re-encode original payload
    
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $expectedSignature = base64_encode($signature);

    if (!hash_equals($expectedSignature, $signatureProvided)) {
         error_log("JWT Signature Verification Failed. Expected: $expectedSignature, Provided: $signatureProvided");
        return null; // Signature verification failed
    }

    if (($decodedPayload['exp'] ?? 0) < time()) {
         error_log("JWT Token Expired. Expiry: " . ($decodedPayload['exp'] ?? 0) . ", Current: " . time());
        return null; // Token expired
    }

    return $decodedPayload;
}

?>
