<?php
// public_html/api/payments/verify_payment.php
require_once '../utils.php'; 
require_once '../db_config.php'; 
require_once '../razorpay_config.php'; 

handle_options_request(); // Must be called before any output

$user_id = ensure_authenticated(); 
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['razorpay_payment_id']) || !isset($input['razorpay_order_id']) || !isset($input['razorpay_signature']) || !isset($input['plan_id'])) {
    send_json_response(['success' => false, 'message' => 'Payment details, plan ID, and signature are required.'], 400);
}

$razorpay_payment_id = sanitize_input($input['razorpay_payment_id']);
$razorpay_order_id = sanitize_input($input['razorpay_order_id']);
$razorpay_signature = $input['razorpay_signature']; 
$plan_id = sanitize_input($input['plan_id']); 

$key_secret = RAZORPAY_KEY_SECRET;
if (empty($key_secret) || $key_secret === 'YOUR_RAZORPAY_KEY_SECRET') {
    error_log('Razorpay Key Secret is not configured or is using placeholder values.');
    send_json_response(['success' => false, 'message' => 'Payment gateway secret not configured. Cannot verify payment.'], 503); // Service Unavailable
}


$data_string = $razorpay_order_id . '|' . $razorpay_payment_id;
$expected_signature = hash_hmac('sha256', $data_string, $key_secret);

if (!hash_equals($expected_signature, $razorpay_signature)) {
    error_log("Razorpay Signature Verification Failed. User ID: $user_id, Order ID: $razorpay_order_id, Expected: $expected_signature, Got: $razorpay_signature");
    send_json_response(['success' => false, 'message' => 'Payment verification failed. Invalid signature.'], 400);
}

try {
    $new_status = 'premium';
    $expiry_date_sql = null;
    $current_date = new DateTime(); 

    // Fetch plan duration from premium_plans table instead of hardcoding
    $stmt_plan = $conn->prepare("SELECT id, name FROM premium_plans WHERE id = ?"); // You might have duration in this table
    $stmt_plan->execute([$plan_id]);
    $plan_details = $stmt_plan->fetch(PDO::FETCH_ASSOC);

    if (!$plan_details) {
        send_json_response(['success' => false, 'message' => 'Invalid plan ID.'], 400);
    }

    // Example: Determine duration based on plan name or a duration column
    // This logic needs to be robust based on how you store plan durations.
    // For this example, I'll assume plan IDs directly indicate duration type.
    if ($plan_id === 'monthly_basic' || strpos(strtolower($plan_details['name']), 'monthly') !== false) {
        $current_date->modify('+1 month');
    } elseif ($plan_id === 'three_month_standard' || strpos(strtolower($plan_details['name']), '3 month') !== false || strpos(strtolower($plan_details['name']), 'quarterly') !== false ) {
        $current_date->modify('+3 months');
    } elseif ($plan_id === 'yearly_premium' || strpos(strtolower($plan_details['name']), 'yearly') !== false || strpos(strtolower($plan_details['name']), 'annual') !== false) {
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
            $_SESSION['user']['isPremium'] = true; 
            // $_SESSION['user']['subscriptionStatus'] = $new_status; // If you store full user object
            // $_SESSION['user']['subscriptionExpiryDate'] = $expiry_date_sql;
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

    