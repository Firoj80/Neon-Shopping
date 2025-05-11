<?php
// public_html/api/payments/create_order.php
require_once '../utils.php'; 
require_once '../db_config.php'; // For user access if needed, or just for consistency
require_once '../razorpay_config.php'; 

handle_options_request(); // Must be called before any output
set_cors_headers();       // Must be called before any output

// User should be authenticated to create an order tied to them
$user_id = ensure_authenticated(); 
$conn = get_db_connection(); // Get DB connection if you need to log order attempts or fetch user details

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['amount']) || !isset($input['currency']) || !isset($input['plan_id'])) {
    send_json_response(['success' => false, 'message' => 'Amount, currency, and plan ID are required.'], 400);
}

$amount_in_units = (float)$input['amount']; // e.g., 5.99
$amount_in_paise = (int)($amount_in_units * 100); // Razorpay expects amount in paise
$currency = strtoupper(sanitize_input($input['currency']));
$receipt_id = 'receipt_' . time() . '_' . bin2hex(random_bytes(8)); // Generate a unique receipt ID
$plan_id = sanitize_input($input['plan_id']); 

// --- Prepare data for Razorpay API ---
$data = [
    'amount'          => $amount_in_paise,
    'currency'        => $currency,
    'receipt'         => $receipt_id,
    'payment_capture' => 1, // Auto capture payment (1 for auto, 0 for manual)
    'notes'           => [ // Optional: Add notes like plan_id, user_id
        'plan_id' => $plan_id,
        'user_id' => $user_id 
    ]
];

// --- Call Razorpay API using cURL ---
$key_id = RAZORPAY_KEY_ID;
$key_secret = RAZORPAY_KEY_SECRET;

$url = 'https://api.razorpay.com/v1/orders';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data)); 
curl_setopt($ch, CURLOPT_USERPWD, $key_id . ':' . $key_secret);

$headers = [];
$headers[] = 'Content-Type: application/x-www-form-urlencoded'; 
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$result = curl_exec($ch);
$http_status_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    error_log('Razorpay cURL Error: ' . curl_error($ch));
    send_json_response(['success' => false, 'message' => 'Error creating Razorpay order (cURL). Details: ' . curl_error($ch)], 500);
}
curl_close($ch);

$razorpay_order = json_decode($result, true);

if ($http_status_code >= 400 || isset($razorpay_order['error'])) {
    $error_description = 'Unknown API error';
    if (isset($razorpay_order['error']) && isset($razorpay_order['error']['description'])) {
        $error_description = $razorpay_order['error']['description'];
    } elseif ($result) {
        // Sometimes error might not be in 'error.description' but in the main body for non-2xx
        $error_description = $result; 
    }
    error_log('Razorpay API Error: ' . $error_description . ' | HTTP Status: ' . $http_status_code);
    send_json_response(['success' => false, 'message' => 'Error creating Razorpay order: ' . $error_description], $http_status_code);
}


if (!isset($razorpay_order['id'])) {
    error_log('Razorpay API Error: Order ID not found in response. Response: ' . $result);
    send_json_response(['success' => false, 'message' => 'Failed to create Razorpay order. Invalid response from gateway.'], 500);
}

// Optionally, you can store preliminary order details in your database here if needed (e.g., for reconciliation)
// Example: Log order attempt
// $stmt_log_order = $conn->prepare("INSERT INTO payment_orders (id, user_id, amount, currency, receipt, status, created_at) VALUES (?, ?, ?, ?, ?, 'created', NOW())");
// $stmt_log_order->execute([$razorpay_order['id'], $user_id, $amount_in_paise, $currency, $receipt_id]);

send_json_response(['success' => true, 'order_id' => $razorpay_order['id'], 'amount' => $amount_in_paise, 'currency' => $currency, 'key_id' => $key_id]);
?>
