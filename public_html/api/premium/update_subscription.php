
<?php
// api/premium/update_subscription.php
require_once '../db_config.php';
require_once '../utils.php';

handle_options_request();
set_cors_headers();

$user_id = ensure_authenticated();
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['planId']) || empty($input['paymentDetails'])) { // paymentDetails can be a transaction ID or some confirmation
    send_json_response(['success' => false, 'message' => 'Plan ID and payment confirmation are required.'], 400);
}

$plan_id = sanitize_input($input['planId']);
$payment_details = sanitize_input($input['paymentDetails']); // Sanitize if it's simple string like transaction ID
// If paymentDetails is an object, sanitize its fields individually.

// Fetch plan details to determine duration
try {
    $stmt_plan = $conn->prepare("SELECT price_monthly, price_yearly FROM premium_plans WHERE id = ? AND is_active = TRUE");
    $stmt_plan->execute([$plan_id]);
    $plan = $stmt_plan->fetch(PDO::FETCH_ASSOC);

    if (!$plan) {
        send_json_response(['success' => false, 'message' => 'Invalid or inactive plan ID.'], 404);
    }

    $new_status = 'premium';
    $expiry_date = null;
    $current_time = time();

    if ($plan['price_monthly']) { // Monthly or N-monthly plan
        $months_valid = 0;
        if ($plan_id === 'monthly_basic') $months_valid = 1;
        if ($plan_id === 'three_month_standard') $months_valid = 3;
        // Add more cases for other N-monthly plans

        if ($months_valid > 0) {
            $expiry_date_obj = new DateTime();
            $expiry_date_obj->setTimestamp($current_time);
            $expiry_date_obj->modify("+{$months_valid} months");
            $expiry_date = $expiry_date_obj->format('Y-m-d H:i:s');
        } else {
             // Fallback or error if plan duration not determinable
            send_json_response(['success' => false, 'message' => 'Could not determine plan duration.'], 400);
        }
    } elseif ($plan['price_yearly']) { // Yearly plan
        $expiry_date_obj = new DateTime();
        $expiry_date_obj->setTimestamp($current_time);
        $expiry_date_obj->modify('+1 year');
        $expiry_date = $expiry_date_obj->format('Y-m-d H:i:s');
    } else {
        // Potentially a lifetime plan or misconfiguration
        // For this example, we'll assume monthly/yearly have prices.
        // If it's a lifetime plan, expiry_date remains null.
    }
    

    // Here, you would typically verify the $payment_details with Razorpay (or your payment gateway)
    // This is a critical step for security and to prevent fraud.
    // For this example, we'll assume payment is verified.
    $payment_verified = true; // Placeholder for actual payment verification logic

    if (!$payment_verified) {
        send_json_response(['success' => false, 'message' => 'Payment verification failed.'], 402); // Payment Required
    }

    // Update user's subscription status
    $stmt_update = $conn->prepare("UPDATE users SET subscription_status = ?, subscription_expiry_date = ? WHERE id = ?");
    if ($stmt_update->execute([$new_status, $expiry_date, $user_id])) {
        // Update session
        $_SESSION['subscription_status'] = $new_status;
        $_SESSION['subscription_expiry_date'] = $expiry_date;

        send_json_response([
            'success' => true,
            'message' => 'Subscription updated successfully.',
            'newStatus' => $new_status,
            'expiryDate' => $expiry_date
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
