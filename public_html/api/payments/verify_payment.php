<?php
// public_html/api/payments/verify_payment.php
require_once '../db_config.php';
require_once '../utils.php';
require_once '../razorpay_config.php'; // Include Razorpay configuration

handle_options_request();
set_cors_headers();

$user_id = ensure_authenticated(); // Make sure user is logged in
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['razorpay_payment_id']) || !isset($input['razorpay_order_id']) || !isset($input['razorpay_signature']) || !isset($input['plan_id'])) {
    send_json_response(['success' => false, 'message' => 'Payment details, plan ID, and signature are required.'], 400);
}

$razorpay_payment_id = sanitize_input($input['razorpay_payment_id']);
$razorpay_order_id = sanitize_input($input['razorpay_order_id']);
$razorpay_signature = sanitize_input($input['razorpay_signature']);
$plan_id = sanitize_input($input['plan_id']); // e.g., 'monthly', 'yearly'

// --- Verify Razorpay Signature ---
// The data string to be hashed: order_id + "|" + payment_id
$data_string = $razorpay_order_id . '|' . $razorpay_payment_id;
$key_secret = RAZORPAY_KEY_SECRET;

$expected_signature = hash_hmac('sha256', $data_string, $key_secret);

if (!hash_equals($expected_signature, $razorpay_signature)) {
    // Signature mismatch - potential tampering
    error_log("Razorpay Signature Verification Failed. User ID: $user_id, Order ID: $razorpay_order_id");
    send_json_response(['success' => false, 'message' => 'Payment verification failed. Invalid signature.'], 400);
}

// --- Payment Verified, Now Update User Subscription ---
try {
    $new_status = 'premium';
    $expiry_date_sql = null;
    $current_date = new DateTime();

    // Determine expiry date based on plan_id
    if ($plan_id === 'monthly') {
        $current_date->modify('+1 month');
    } elseif ($plan_id === 'three_month') {
        $current_date->modify('+3 months');
    } elseif ($plan_id === 'yearly') {
        $current_date->modify('+1 year');
    } else {
        send_json_response(['success' => false, 'message' => 'Invalid plan ID.'], 400);
    }
    $expiry_date_sql = $current_date->format('Y-m-d H:i:s');


    $stmt_update = $conn->prepare("UPDATE users SET subscription_status = ?, subscription_expiry_date = ? WHERE id = ?");
    if ($stmt_update->execute([$new_status, $expiry_date_sql, $user_id])) {
        // Update session if you are using PHP sessions for auth state
        if (session_status() == PHP_SESSION_NONE) {
            start_secure_session();
        }
        $_SESSION['subscription_status'] = $new_status;
        $_SESSION['subscription_expiry_date'] = $expiry_date_sql;

        // Optionally, log the transaction
        // $stmt_log = $conn->prepare("INSERT INTO payment_transactions (user_id, order_id, payment_id, plan_id, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?, 'success')");
        // $stmt_log->execute([$user_id, $razorpay_order_id, $razorpay_payment_id, $plan_id, $input['amount_paid_to_verify'] ?? 0, $input['currency_to_verify'] ?? '']);

        send_json_response([
            'success' => true,
            'message' => 'Subscription updated successfully.',
            'newStatus' => $new_status,
            'expiryDate' => $expiry_date_sql
        ]);
    } else {
        error_log("Failed to update user subscription. User ID: $user_id, Order ID: $razorpay_order_id");
        send_json_response(['success' => false, 'message' => 'Failed to update subscription status in database.'], 500);
    }

} catch (PDOException $e) {
    error_log("Verify Payment DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error during subscription update.'], 500);
} catch (Exception $e) { // Catch general exceptions (e.g., from DateTime)
    error_log("Verify Payment General Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Error processing subscription update.'], 500);
}
?>