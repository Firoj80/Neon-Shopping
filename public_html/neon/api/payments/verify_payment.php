<?php
// public_html/api/payments/verify_payment.php
require_once '../utils.php'; 
handle_options_request(); // Must be called before any output

require_once '../db_config.php'; 
require_once '../razorpay_config.php'; 


$user_id = ensure_authenticated(); 
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['razorpay_payment_id']) || !isset($input['razorpay_order_id']) || !isset($input['razorpay_signature']) || !isset($input['plan_id'])) {
    send_json_response(['success' => false, 'message' => 'Payment details, plan ID, and signature are required.'], 400);
}

$razorpay_payment_id = sanitize_input($input['razorpay_payment_id']);
$razorpay_order_id = sanitize_input($input['razorpay_order_id']);
$razorpay_signature = $input['razorpay_signature']; // Signature should not be sanitized 
$plan_id = sanitize_input($input['plan_id']); 

// --- Verify Razorpay Signature ---
$key_secret = RAZORPAY_KEY_SECRET;

if (empty($key_secret) || $key_secret === 'YOUR_RAZORPAY_KEY_SECRET') {
    error_log('Razorpay Key Secret is not configured or is using placeholder values.');
    send_json_response(['success' => false, 'message' => 'Payment gateway secret not configured. Cannot verify payment.'], 503); 
}


$data_string = $razorpay_order_id . '|' . $razorpay_payment_id;
$expected_signature = hash_hmac('sha256', $data_string, $key_secret);

if (!hash_equals($expected_signature, $razorpay_signature)) {
    error_log("Razorpay Signature Verification Failed. User ID: $user_id, Order ID: $razorpay_order_id, Expected: $expected_signature, Got: $razorpay_signature");
    send_json_response(['success' => false, 'message' => 'Payment verification failed. Invalid signature.'], 400);
}

// --- Payment Verified, Now Update User Subscription ---
try {
    $new_status = 'premium';
    $expiry_date_sql = null;
    $current_date = new DateTime(); 

    // Fetch plan duration from premium_plans table
    $stmt_plan = $conn->prepare("SELECT id, name, price_monthly, price_yearly FROM premium_plans WHERE id = ? AND is_active = TRUE");
    $stmt_plan->execute([$plan_id]);
    $plan_details = $stmt_plan->fetch(PDO::FETCH_ASSOC);

    if (!$plan_details) {
        send_json_response(['success' => false, 'message' => 'Invalid or inactive plan ID.'], 400);
    }

    // Determine duration based on plan_id or other plan details
    // This logic assumes plan_id directly corresponds to a duration or plan name contains duration info
    // A more robust way would be to have a 'duration_months' or 'duration_days' column in premium_plans
    if ($plan_id === 'monthly_basic' || ($plan_details['price_monthly'] && !$plan_details['price_yearly'])) {
        $current_date->modify('+1 month');
    } elseif ($plan_id === 'three_month_standard') { // Example, adjust if your plan IDs differ
        $current_date->modify('+3 months');
    } elseif ($plan_id === 'yearly_premium' || $plan_details['price_yearly']) {
        $current_date->modify('+1 year');
    } else {
        error_log("Could not determine subscription duration for plan ID: $plan_id, Name: {$plan_details['name']}");
        send_json_response(['success' => false, 'message' => 'Invalid plan ID for subscription duration determination.'], 400);
    }
    $expiry_date_sql = $current_date->format('Y-m-d H:i:s');


    $stmt_update = $conn->prepare("UPDATE users SET subscription_status = ?, subscription_expiry_date = ? WHERE id = ?");
    if ($stmt_update->execute([$new_status, $expiry_date_sql, $user_id])) {
        start_secure_session(); 
        $_SESSION['subscription_status'] = $new_status;
        $_SESSION['subscription_expiry_date'] = $expiry_date_sql;
         if (isset($_SESSION['user'])) { 
            // If you are storing a user object in session, update its premium status too
            // Example: $_SESSION['user']['isPremium'] = true; 
            // Example: $_SESSION['user']['subscriptionStatus'] = $new_status; 
        }

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
} catch (Exception $e) { 
    error_log("Verify Payment General Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Error processing subscription update.'], 500);
}
?>
