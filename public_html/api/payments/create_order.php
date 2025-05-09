<?php
// public_html/api/payments/create_order.php
require_once '../db_config.php';
require_once '../utils.php';
require_once '../razorpay_config.php'; // Include Razorpay configuration

handle_options_request();
set_cors_headers();

// Ensure user is authenticated (you might have a different way to get user_id)
// For this example, let's assume user_id is passed or retrieved from session
// $user_id = ensure_authenticated(); // If you have a session-based auth

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['amount']) || !isset($input['currency']) || !isset($input['plan_id'])) {
    send_json_response(['success' => false, 'message' => 'Amount, currency, and plan ID are required.'], 400);
}

$amount_in_paise = (int)($input['amount'] * 100); // Razorpay expects amount in paise
$currency = strtoupper(sanitize_input($input['currency']));
$receipt_id = 'receipt_' . time() . '_' . uniqid(); // Generate a unique receipt ID
$plan_id = sanitize_input($input['plan_id']); // You might use this to log the plan

// --- Prepare data for Razorpay API ---
$data = [
    'amount'          => $amount_in_paise,
    'currency'        => $currency,
    'receipt'         => $receipt_id,
    'payment_capture' => 1 // Auto capture payment
];

// --- Call Razorpay API using cURL ---
$key_id = RAZORPAY_KEY_ID;
$key_secret = RAZORPAY_KEY_SECRET;

$url = 'https://api.razorpay.com/v1/orders';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data)); // Send as form data
curl_setopt($ch, CURLOPT_USERPWD, $key_id . ':' . $key_secret);

$headers = [];
$headers[] = 'Content-Type: application/x-www-form-urlencoded'; // Required for form data
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$result = curl_exec($ch);
if (curl_errno($ch)) {
    error_log('Razorpay cURL Error: ' . curl_error($ch));
    send_json_response(['success' => false, 'message' => 'Error creating Razorpay order (cURL).'], 500);
}
curl_close($ch);

$razorpay_order = json_decode($result, true);

if (isset($razorpay_order['error'])) {
    error_log('Razorpay API Error: ' . $razorpay_order['error']['description']);
    send_json_response(['success' => false, 'message' => 'Error creating Razorpay order: ' . ($razorpay_order['error']['description'] ?? 'Unknown API error')], 500);
}

if (!isset($razorpay_order['id'])) {
    error_log('Razorpay API Error: Order ID not found in response. Response: ' . $result);
    send_json_response(['success' => false, 'message' => 'Failed to create Razorpay order. Invalid response from gateway.'], 500);
}

// Optionally, you can store order details in your database here if needed.

send_json_response(['success' => true, 'order_id' => $razorpay_order['id'], 'amount' => $amount_in_paise, 'currency' => $currency, 'key_id' => $key_id]);
?>