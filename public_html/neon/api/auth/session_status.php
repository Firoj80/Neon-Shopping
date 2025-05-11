<?php
// api/auth/session_status.php

// IMPORTANT: Suppress errors from being output directly to the browser, which can break headers.
// In production, ensure PHP error logging is properly configured on the server.
error_reporting(0);
@ini_set('display_errors', 0);

require_once '../utils.php';
handle_options_request(); // Crucial: Must be called first for CORS preflight

require_once '../db_config.php';

error_log("session_status.php: Accessed at " . date("Y-m-d H:i:s"));

$user_id = get_current_user_id(); // This also starts the session

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

            // If DB status is premium but expired, update DB and session
            if ($user_data['subscription_status'] === 'premium' && !$is_premium) {
                $stmt_update = $conn->prepare("UPDATE users SET subscription_status = 'free', subscription_expiry_date = NULL WHERE id = ?");
                $stmt_update->execute([$user_id]);
                $user_data['subscription_status'] = 'free'; // Reflect change in local var
                $user_data['subscription_expiry_date'] = null;
                error_log("session_status.php: User '{$user_id}' subscription found expired. Downgraded to free in DB.");
            }

             // Sync session with (potentially updated) DB status
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
                    'name' => $_SESSION['user_name'] ?? $user_data['name'],
                    'email' => $_SESSION['user_email'] ?? $user_data['email'],
                    'isPremium' => $is_premium,
                ]
            ]);
        } else {
            error_log("session_status.php: User ID '{$user_id}' in session, but not found in DB. Destroying session.");
            session_destroy();
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
