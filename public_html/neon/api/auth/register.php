
<?php
// api/auth/register.php
require_once '../utils.php'; 
require_once '../db_config.php';

handle_options_request(); // Must be called before any output

$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    send_json_response(['success' => false, 'message' => 'Invalid input.'], 400);
}

$name = sanitize_input($input['name'] ?? '');
$email = sanitize_input($input['email'] ?? '');
$password = $input['password'] ?? ''; 

if (empty($name) || empty($email) || empty($password)) {
    send_json_response(['success' => false, 'message' => 'Name, email, and password are required.'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    send_json_response(['success' => false, 'message' => 'Invalid email format.'], 400);
}

if (strlen($password) < 6) { 
    send_json_response(['success' => false, 'message' => 'Password must be at least 6 characters long.'], 400);
}

try {
    $stmt_check = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt_check->execute([$email]);
    if ($stmt_check->fetch()) {
        send_json_response(['success' => false, 'message' => 'Email already registered.'], 409); 
    }
} catch (PDOException $e) {
    error_log("Register Check DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Error checking email.'], 500);
}

$user_id = bin2hex(random_bytes(16)); 
$password_hash = password_hash($password, PASSWORD_DEFAULT);

try {
    // Initialize subscription_status to 'free' and expiry_date to NULL for new users
    $stmt_insert = $conn->prepare("INSERT INTO users (id, name, email, password_hash, subscription_status, subscription_expiry_date) VALUES (?, ?, ?, ?, 'free', NULL)");
    if ($stmt_insert->execute([$user_id, $name, $email, $password_hash])) {
        start_secure_session(); 
        $_SESSION['user_id'] = $user_id;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;
        $_SESSION['subscription_status'] = 'free'; // Set session subscription status
        $_SESSION['subscription_expiry_date'] = null;

        send_json_response([
            'success' => true,
            'message' => 'User registered successfully.',
            'user' => ['id' => $user_id, 'name' => $name, 'email' => $email, 'isPremium' => false]
        ], 201);
    } else {
        send_json_response(['success' => false, 'message' => 'Failed to register user.'], 500);
    }
} catch (PDOException $e) {
    error_log("Register Insert DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error during registration.'], 500);
}
?>

    