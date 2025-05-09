<?php
// api/php/auth/register.php
require_once '../utils.php'; // For CORS and other utilities
require_once '../db_config.php';

handle_options_request(); // Handle preflight
set_cors_headers(); // Set CORS for actual request

$conn = get_db_connection();

$input = json_decode(file_get_contents('php://input'), true);

$name = $input['name'] ?? '';
$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

if (empty($name) || empty($email) || empty($password)) {
    send_json_response(['success' => false, 'message' => 'All fields are required.'], 400);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json_response(['success' => false, 'message' => 'Invalid email format.'], 400);
    exit;
}

if (strlen($password) < 6) {
    send_json_response(['success' => false, 'message' => 'Password must be at least 6 characters.'], 400);
    exit;
}

// Check if email already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
if ($result->num_rows > 0) {
    send_json_response(['success' => false, 'message' => 'Email already registered.'], 409); // 409 Conflict
    $stmt->close();
    $conn->close();
    exit;
}
$stmt->close();

$password_hash = password_hash($password, PASSWORD_BCRYPT);
$user_id = bin2hex(random_bytes(16)); // Generate a UUID-like ID

$stmt = $conn->prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $user_id, $name, $email, $password_hash);

if ($stmt->execute()) {
    // Start session and store user info
    if (session_status() == PHP_SESSION_NONE) {
        session_start([
            'cookie_lifetime' => 86400 * 30, // 30 days
            'cookie_secure' => true, // Send cookie only over HTTPS
            'cookie_httponly' => true, // Prevent JavaScript access to session cookie
            'cookie_samesite' => 'Lax' // CSRF protection
        ]);
    }
    $_SESSION['user_id'] = $user_id;
    $_SESSION['user_name'] = $name;
    $_SESSION['user_email'] = $email;

    send_json_response([
        'success' => true,
        'message' => 'User registered successfully.',
        'user' => ['id' => $user_id, 'name' => $name, 'email' => $email]
    ], 201);
} else {
    error_log("Registration DB Error: " . $stmt->error);
    send_json_response(['success' => false, 'message' => 'Registration failed. Please try again.'], 500);
}

$stmt->close();
$conn->close();
?>
