
<?php
// api/premium/update_subscription.php
require_once '../utils.php'; 
require_once '../db_config.php';

handle_options_request(); // Must be called before any output
set_cors_headers();       // Must be called before any output

$user_id = ensure_authenticated();
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

// This endpoint would typically be called by a payment gateway webhook or after client-side payment confirmation
// For simplicity, this example assumes a direct call after "payment"
// In a real app, VERIFY THE PAYMENT DETAILS SECURELY with the payment gateway (e.g., Razorpay server-side verification)

if (!$input || empty($input['planId']) || empty($input['paymentDetails'])) { 
    send_json_response(['success' => false, 'message' => 'Plan ID and payment confirmation are required.'], 400);
}

$plan_id = sanitize_input($input['planId']);
$payment_details_token = sanitize_input($input['paymentDetails']); // e.g., Razorpay payment_id, order_id, signature

// --- !!! CRITICAL: PAYMENT VERIFICATION !!! ---
// This is where you'd integrate with Razorpay's server-side SDK to verify the payment.
// Example: $api->payment->fetch($payment_details_token['razorpay_payment_id'])->capture([...]);
// And verify the signature: $api->utility->verifyPaymentSignature([...]);
// For this example, we'll assume payment is verified for brevity.
$payment_verified_successfully = true; // <<<< REPLACE THIS WITH ACTUAL VERIFICATION LOGIC

if (!$payment_verified_successfully) {
    send_json_response(['success' => false, 'message' => 'Payment verification failed.'], 402); // Payment Required or Bad Request
}

// Fetch plan details to determine duration
try {
    $stmt_plan = $conn->prepare("SELECT price_monthly, price_yearly FROM premium_plans WHERE id = ? AND is_active = TRUE");
    $stmt_plan->execute([$plan_id]);
    $plan = $stmt_plan->fetch(PDO::FETCH_ASSOC);

    if (!$plan) {
        send_json_response(['success' => false, 'message' => 'Invalid or inactive plan ID.'], 404);
    }

    $new_status = 'premium';
    $expiry_date_sql = null;
    $current_date = new DateTime(); // Use current server time

    // Determine expiry date based on plan_id (use the plan IDs from your premium_plans table)
    if ($plan_id === 'monthly_basic') { // Example plan ID
        $current_date->modify('+1 month');
    } elseif ($plan_id === 'three_month_standard') { // Example plan ID
        $current_date->modify('+3 months');
    } elseif ($plan_id === 'yearly_premium') { // Example plan ID
        $current_date->modify('+1 year');
    } else {
        // Fallback or error if plan duration not determinable or unknown plan_id
        send_json_response(['success' => false, 'message' => 'Could not determine plan duration for the given plan ID.'], 400);
    }
    $expiry_date_sql = $current_date->format('Y-m-d H:i:s');
    

    // Update user's subscription status in 'users' table
    $stmt_update_user = $conn->prepare("UPDATE users SET subscription_status = ?, subscription_expiry_date = ? WHERE id = ?");
    if ($stmt_update_user->execute([$new_status, $expiry_date_sql, $user_id])) {
        // Update session
        start_secure_session(); // Ensure session is active
        $_SESSION['subscription_status'] = $new_status;
        $_SESSION['subscription_expiry_date'] = $expiry_date_sql;
        if (isset($_SESSION['user_data'])) { // If you store user data object in session
            $_SESSION['user_data']['isPremium'] = true; 
        }


        // Optionally, log the transaction in a 'transactions' table
        // $stmt_log = $conn->prepare("INSERT INTO transactions (user_id, plan_id, payment_id, amount, currency, status, transaction_date) VALUES (?, ?, ?, ?, ?, 'success', NOW())");
        // $stmt_log->execute([$user_id, $plan_id, $payment_details_token['razorpay_payment_id'] ?? 'N/A', $input['amount'] ?? 0, $input['currency'] ?? 'USD']);


        send_json_response([
            'success' => true,
            'message' => 'Subscription updated successfully.',
            'newStatus' => $new_status,
            'expiryDate' => $expiry_date_sql
        ]);
    } else {
        send_json_response(['success' => false, 'message' => 'Failed to update subscription status.'], 500);
    }

} catch (PDOException $e) {
    error_log("Update Subscription DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error updating subscription.'], 500);
} catch (Exception $e) { // Catch general exceptions from DateTime
    error_log("Update Subscription General Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Error processing subscription update.'], 500);
}
?>
