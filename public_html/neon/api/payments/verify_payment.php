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
$razorpay_signature = $input['razorpay_signature']; // Signature should not be sanitized in a way that alters it
$plan_id = sanitize_input($input['plan_id']); 

// --- Verify Razorpay Signature ---
$key_secret = RAZORPAY_KEY_SECRET;

// Check if Razorpay Key Secret is configured
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

// --- Payment Verified, Now Update User Subscription ---
try {
    $new_status = 'premium';
    $expiry_date_sql = null;
    $current_date = new DateTime(); // Use current server time

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
        // Fallback or error if plan duration not determinable or unknown plan_id
        error_log("Could not determine subscription duration for plan ID: $plan_id, Name: {$plan_details['name']}");
        send_json_response(['success' => false, 'message' => 'Invalid plan ID for subscription duration determination.'], 400);
    }
    $expiry_date_sql = $current_date->format('Y-m-d H:i:s');


    $stmt_update = $conn->prepare("UPDATE users SET subscription_status = ?, subscription_expiry_date = ? WHERE id = ?");
    if ($stmt_update->execute([$new_status, $expiry_date_sql, $user_id])) {
        // Update session
        start_secure_session(); // Ensure session is active
        $_SESSION['subscription_status'] = $new_status;
        $_SESSION['subscription_expiry_date'] = $expiry_date_sql;
         if (isset($_SESSION['user'])) { // If you store full user object in session
            $_SESSION['user']['isPremium'] = true; 
            // $_SESSION['user']['subscriptionStatus'] = $new_status; 
            // $_SESSION['user']['subscriptionExpiryDate'] = $expiry_date_sql;
        }


        // Optionally, log the transaction in a 'payment_transactions' table for auditing
        // $amount_paid = $input['amount_paid'] ?? 0; // Get amount from input if client sends it, or fetch order from Razorpay
        // $currency_paid = $input['currency_paid'] ?? 'INR'; // Get currency
        // $stmt_log = $conn->prepare("INSERT INTO payment_transactions (user_id, razorpay_order_id, razorpay_payment_id, plan_id, amount_paid, currency_paid, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'success', NOW())");
        // $stmt_log->execute([$user_id, $razorpay_order_id, $razorpay_payment_id, $plan_id, $amount_paid, $currency_paid]);

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

    

    