<?php
// public_html/api/payments/create_order.php
require_once '../utils.php'; 
require_once '../db_config.php'; 
require_once '../razorpay_config.php'; 

handle_options_request(); // Must be called before any output

$user_id = ensure_authenticated(); 
$conn = get_db_connection(); 

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['amount']) || !isset($input['currency']) || !isset($input['plan_id'])) {
    send_json_response(['success' => false, 'message' => 'Amount, currency, and plan ID are required.'], 400);
}

$amount_in_units = (float)$input['amount']; 
$amount_in_paise = (int)($amount_in_units * 100); 
$currency = strtoupper(sanitize_input($input['currency']));
$receipt_id = 'receipt_' . time() . '_' . bin2hex(random_bytes(8)); 
$plan_id = sanitize_input($input['plan_id']); 

$data = [
    'amount'          => $amount_in_paise,
    'currency'        => $currency,
    'receipt'         => $receipt_id,
    'payment_capture' => 1, 
    'notes'           => [ 
        'plan_id' => $plan_id,
        'user_id' => $user_id 
    ]
];

$key_id = RAZORPAY_KEY_ID;
$key_secret = RAZORPAY_KEY_SECRET;

if (empty($key_id) || empty($key_secret) || $key_id === 'YOUR_RAZORPAY_KEY_ID') {
    error_log('Razorpay API keys are not configured or are using placeholder values.');
    send_json_response(['success' => false, 'message' => 'Payment gateway not configured. Please contact support.'], 503); // Service Unavailable
}


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
    error_log('Razorpay cURL Error creating order: ' . curl_error($ch));
    send_json_response(['success' => false, 'message' => 'Error creating payment order. Details: ' . curl_error($ch)], 500);
}
curl_close($ch);

$razorpay_order = json_decode($result, true);

if ($http_status_code >= 400 || isset($razorpay_order['error'])) {
    $error_description = 'Unknown API error';
    if (isset($razorpay_order['error']) && isset($razorpay_order['error']['description'])) {
        $error_description = $razorpay_order['error']['description'];
    } elseif ($result) {
        $error_description = $result; 
    }
    error_log('Razorpay API Error (Create Order): ' . $error_description . ' | HTTP Status: ' . $http_status_code . ' | Response: ' . $result);
    send_json_response(['success' => false, 'message' => 'Error creating Razorpay order: ' . $error_description], ($http_status_code < 100 || $http_status_code > 599) ? 500 : $http_status_code);
}


if (!isset($razorpay_order['id'])) {
    error_log('Razorpay API Error: Order ID not found in response. Response: ' . $result);
    send_json_response(['success' => false, 'message' => 'Failed to create Razorpay order. Invalid response from gateway.'], 500);
}

send_json_response(['success' => true, 'order_id' => $razorpay_order['id'], 'amount' => $amount_in_paise, 'currency' => $currency, 'key_id' => $key_id]);
?>

    