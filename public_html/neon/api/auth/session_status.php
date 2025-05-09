<?php
// api/auth/session_status.php
require_once '../utils.php'; 
require_once '../db_config.php'; 

handle_options_request(); // Crucial: Must be called first for CORS preflight

error_log("session_status.php: Accessed at " . date("Y-m-d H:i:s")); // Log access

$user_id = get_current_user_id(); // This function also starts the session

if ($user_id) {
    error_log("session_status.php: User ID '{$user_id}' found in session.");
    $conn = get_db_connection();
    try {
        $stmt = $conn->prepare("SELECT name, email, subscription_status, subscription_expiry_date FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user_data = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user_data) {
            $is_premium = false;
            if ($user_data['subscription_status'] === 'premium') {
                 $is_premium = $user_data['subscription_expiry_date'] === null || strtotime($user_data['subscription_expiry_date']) > time();
            }

            // Downgrade if premium status is 'premium' but expiry date has passed
            if ($user_data['subscription_status'] === 'premium' && !$is_premium) {
                $stmt_update = $conn->prepare("UPDATE users SET subscription_status = 'free', subscription_expiry_date = NULL WHERE id = ?");
                $stmt_update->execute([$user_id]);
                $user_data['subscription_status'] = 'free'; // Reflect change locally
                $user_data['subscription_expiry_date'] = null;
                error_log("session_status.php: User '{$user_id}' subscription found expired. Downgraded to free in DB.");
            }


            // Sync session with DB if necessary (e.g., after expiry downgrade or admin change)
             if (!isset($_SESSION['subscription_status']) || 
                 $_SESSION['subscription_status'] !== $user_data['subscription_status'] ||
                 $_SESSION['subscription_expiry_date'] !== $user_data['subscription_expiry_date']) {
                 
                 $_SESSION['subscription_status'] = $user_data['subscription_status'];
                 $_SESSION['subscription_expiry_date'] = $user_data['subscription_expiry_date'];
                 error_log("session_status.php: Session synced with DB for user '{$user_id}'. Status: {$user_data['subscription_status']}");
            }


            send_json_response([
                'isAuthenticated' => true,
                'user' => [
                    'id' => $user_id,
                    'name' => $_SESSION['user_name'] ?? $user_data['name'], // Prefer session, fallback to DB
                    'email' => $_SESSION['user_email'] ?? $user_data['email'],
                    'isPremium' => $is_premium, // Use the calculated $is_premium
                ]
            ]);
        } else {
            error_log("session_status.php: User ID '{$user_id}' in session, but not found in DB. Destroying session.");
            // User ID in session, but not in DB (should ideally not happen if DB is consistent and sessions are managed well)
            session_destroy(); // Clean up invalid session
            send_json_response(['isAuthenticated' => false, 'message' => 'Session invalid, user not found.'], 401);
        }

    } catch (PDOException $e) {
        error_log("session_status.php: DB Error for user '{$user_id}': " . $e->getMessage());
        send_json_response(['isAuthenticated' => false, 'error' => 'Could not verify user details due to a database issue.'], 500);
    }

} else {
    error_log("session_status.php: No user ID in session.");
    send_json_response(['isAuthenticated' => false, 'user' => null]);
}
?>

    

    