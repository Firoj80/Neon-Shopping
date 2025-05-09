
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

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: {$origin}");
} else {
    // If the origin is not in the allowed list, you might choose to:
    // 1. Not send the header (browser will block)
    // 2. Send a default allowed origin (e.g., your main production domain)
    // 3. For debugging, you could temporarily use '*' but this is insecure for production.
    // error_log("CORS: Origin '{$origin}' not in allowed list: " . implode(', ', $allowed_origins));
    // For now, we only explicitly allow listed origins.
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Cookie, X-User-ID, Cache-Control, Pragma, Expires");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400"); // Cache preflight requests for 1 day

function handle_options_request() {
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        // No further processing needed for OPTIONS requests.
        // Headers are already set above.
        http_response_code(204); // No Content - Standard for successful OPTIONS
        exit;
    }
}

// Call handle_options_request() at the beginning of any script that might receive OPTIONS requests.
// For example, in your API endpoint files like login.php, register.php, session_status.php, etc.
// handle_options_request(); // This will be called in each endpoint file now.

function send_json_response($data, $status_code = 200) {
    // CORS headers are set globally at the top of this file,
    // so they apply to all responses.
    http_response_code($status_code);
    // Ensure Content-Type is always application/json for JSON responses
    header('Content-Type: application/json'); 
    echo json_encode($data);
    exit; 
}

function start_secure_session() {
    if (session_status() == PHP_SESSION_NONE) {
        $is_https = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
        
        // Determine cookie domain dynamically or set specifically for production
        $cookie_domain = ""; // Example: ".digitalfiroj.com" for production if API and frontend share subdomains
                             // For localhost or different domains, leave empty or configure appropriately.
        
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $is_localhost = (strpos($host, 'localhost') !== false || strpos($host, '127.0.0.1') !== false);

        session_set_cookie_params([
            'lifetime' => 28800, // 8 hours
            'path' => '/',
            'domain' => $cookie_domain, // Important for cross-subdomain cookies if applicable
            'secure' => $is_https,
            'httponly' => true,
            'samesite' => ($is_https && !$is_localhost) ? 'None' : 'Lax' 
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

// JWT Secret - Ensure this is strong and matches any client-side expectations if JWTs are used directly by client.
// However, for PHP sessions, JWT might be more for server-to-server or advanced scenarios.
// For simple session management, PHP's built-in sessions with HttpOnly cookies are often sufficient.
define('JWT_SECRET', 'your-very-strong-and-secret-jwt-key-here-make-sure-its-long-and-random'); // CHANGE THIS!

// Basic JWT functions (example, consider a library for production)
// These are not strictly necessary if you're relying on PHP's native session handling for authentication state.
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

    $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
    $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
    $signatureProvided = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[2])); // Note: signature is not base64url encoded in standard JWT

    $decodedHeader = json_decode($header, true);
    $decodedPayload = json_decode($payload, true);

    if (!$decodedHeader || !$decodedPayload || strtoupper($decodedHeader['alg'] ?? '') !== 'HS256') return null;
    
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    
    if (!hash_equals($signature, $signatureProvided)) {
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

    