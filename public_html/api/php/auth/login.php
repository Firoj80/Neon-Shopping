<?php
// api/php/auth/login.php
require_once '../utils.php';
require_once '../db_config.php';

handle_options_request();
set_cors_headers();

$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

$email = $input['email'] ?? '';
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    send_json_response(['success' => false, 'message' => 'Email and password are required.'], 400);
    exit;
}

$stmt = $conn->prepare("SELECT id, name, email, password_hash FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($user_data = $result->fetch_assoc()) {
    if (password_verify($password, $user_data['password_hash'])) {
        if (session_status() == PHP_SESSION_NONE) {
             session_start([
                'cookie_lifetime' => 86400 * 30,
                'cookie_secure' => true,
                'cookie_httponly' => true,
                'cookie_samesite' => 'Lax'
            ]);
        }
        $_SESSION['user_id'] = $user_data['id'];
        $_SESSION['user_name'] = $user_data['name'];
        $_SESSION['user_email'] = $user_data['email'];

        send_json_response([
            'success' => true,
            'message' => 'Login successful.',
            'user' => ['id' => $user_data['id'], 'name' => $user_data['name'], 'email' => $user_data['email']]
        ]);
    } else {
        send_json_response(['success' => false, 'message' => 'Invalid email or password.'], 401);
    }
} else {
    send_json_response(['success' => false, 'message' => 'Invalid email or password.'], 401);
}

$stmt->close();
$conn->close();
?>
