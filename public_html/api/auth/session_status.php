
<?php
// api/auth/session_status.php
require_once '../utils.php'; // Adjust path if your utils.php is elsewhere
require_once '../db_config.php'; 

handle_options_request(); // Must be called before any output
set_cors_headers();       // Must be called before any output

$user_id = get_current_user_id(); // This function also starts the session

if ($user_id) {
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

            // If session status is premium but DB says expired (or free), update session
             if (isset($_SESSION['subscription_status']) && $_SESSION['subscription_status'] === 'premium' && !$is_premium) {
                $_SESSION['subscription_status'] = 'free';
                $_SESSION['subscription_expiry_date'] = null;
            } else if (!isset($_SESSION['subscription_status']) || $_SESSION['subscription_status'] !== $user_data['subscription_status']) {
                 // Sync session if DB status is different (e.g. admin change or initial load)
                 $_SESSION['subscription_status'] = $user_data['subscription_status'];
                 $_SESSION['subscription_expiry_date'] = $user_data['subscription_expiry_date'];
            }


            send_json_response([
                'isAuthenticated' => true,
                'user' => [
                    'id' => $user_id,
                    'name' => $_SESSION['user_name'] ?? $user_data['name'], // Prefer session, fallback to DB
                    'email' => $_SESSION['user_email'] ?? $user_data['email'],
                    'isPremium' => $is_premium, 
                ]
            ]);
        } else {
            // User ID in session, but not in DB (shouldn't happen if DB is consistent)
            session_destroy(); // Clean up invalid session
            send_json_response(['isAuthenticated' => false, 'message' => 'Session invalid, user not found.'], 401);
        }

    } catch (PDOException $e) {
        error_log("Session Status DB Error: " . $e->getMessage());
        send_json_response(['isAuthenticated' => false, 'error' => 'Could not verify user details due to a database issue.'], 500);
    }

} else {
    send_json_response(['isAuthenticated' => false, 'user' => null]);
}
?>
