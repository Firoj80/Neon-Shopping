
<?php
// api/premium/check_subscription.php
require_once '../utils.php'; 
require_once '../db_config.php';

handle_options_request(); // Must be called before any output
set_cors_headers();       // Must be called before any output

$user_id = ensure_authenticated();
$conn = get_db_connection();

try {
    $stmt = $conn->prepare("SELECT subscription_status, subscription_expiry_date FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $is_premium = false;
        $is_expired = false;

        if ($user['subscription_status'] === 'premium') {
            if ($user['subscription_expiry_date'] === null) { // Lifetime or non-expiring premium
                $is_premium = true;
            } else {
                $expiry_timestamp = strtotime($user['subscription_expiry_date']);
                if ($expiry_timestamp && $expiry_timestamp > time()) {
                    $is_premium = true;
                } else {
                    $is_expired = true; 
                }
            }
        }
        
        if ($is_expired) {
            $stmt_update = $conn->prepare("UPDATE users SET subscription_status = 'free', subscription_expiry_date = NULL WHERE id = ?");
            $stmt_update->execute([$user_id]);
             // Update session as well
            start_secure_session();
            $_SESSION['subscription_status'] = 'free';
            $_SESSION['subscription_expiry_date'] = null;
            $is_premium = false; 
        }


        send_json_response([
            'success' => true,
            'isPremium' => $is_premium,
            'status' => $is_premium ? 'premium' : 'free',
            'expiryDate' => $is_premium ? $user['subscription_expiry_date'] : null
        ]);
    } else {
        send_json_response(['success' => false, 'message' => 'User not found.'], 404);
    }
} catch (PDOException $e) {
    error_log("Check Subscription DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error checking subscription.'], 500);
}
?>
