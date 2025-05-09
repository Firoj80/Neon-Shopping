
<?php
// api/auth/login.php
require_once '../utils.php'; 
require_once '../db_config.php';

handle_options_request(); // Must be called before any output
set_cors_headers();       // Must be called before any output

$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    send_json_response(['success' => false, 'message' => 'Invalid input.'], 400);
}

$email = sanitize_input($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    send_json_response(['success' => false, 'message' => 'Email and password are required.'], 400);
}

try {
    $stmt = $conn->prepare("SELECT id, name, email, password_hash, subscription_status, subscription_expiry_date FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password_hash'])) {
        start_secure_session(); // Ensure session is started before setting variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['subscription_status'] = $user['subscription_status'];
        $_SESSION['subscription_expiry_date'] = $user['subscription_expiry_date'];

        $is_premium = false;
        if ($user['subscription_status'] === 'premium') {
            $is_premium = $user['subscription_expiry_date'] === null || strtotime($user['subscription_expiry_date']) > time();
        }
        
        if (!$is_premium && $user['subscription_status'] === 'premium') { // Subscription expired
            $_SESSION['subscription_status'] = 'free'; // Downgrade in session
            // Optionally, update database here too
            $stmt_update = $conn->prepare("UPDATE users SET subscription_status = 'free', subscription_expiry_date = NULL WHERE id = ?");
            $stmt_update->execute([$user['id']]);
        }


        send_json_response([
            'success' => true,
            'message' => 'Login successful.',
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'isPremium' => $is_premium,
            ]
        ]);
    } else {
        send_json_response(['success' => false, 'message' => 'Invalid email or password.'], 401);
    }
} catch (PDOException $e) {
    error_log("Login DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error during login.'], 500);
}
?>
