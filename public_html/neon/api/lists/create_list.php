<?php
// api/lists/create_list.php
require_once '../utils.php'; 
handle_options_request(); // Must be called before any output

require_once '../db_config.php';


define('FREEMIUM_LIST_LIMIT_PHP', 3); 

$user_id = ensure_authenticated(); // This will exit if user is not authenticated
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    send_json_response(['success' => false, 'message' => 'Invalid input.'], 400);
}

$name = sanitize_input($input['name'] ?? '');
$budget_limit = isset($input['budgetLimit']) ? (float)$input['budgetLimit'] : 0.00; // Default to 0.00 if not set or invalid
$default_category = sanitize_input($input['defaultCategory'] ?? 'uncategorized');

if (empty($name)) {
    send_json_response(['success' => false, 'message' => 'List name is required.'], 400);
}

// Check list limit for non-premium users
$is_premium = false; 
// Re-check premium status from DB for security, though session should be primary source
$stmt_user_check_premium = $conn->prepare("SELECT subscription_status, subscription_expiry_date FROM users WHERE id = ?");
$stmt_user_check_premium->execute([$user_id]);
if ($user_details_premium = $stmt_user_check_premium->fetch(PDO::FETCH_ASSOC)) {
    if ($user_details_premium['subscription_status'] === 'premium') {
        $is_premium = $user_details_premium['subscription_expiry_date'] === null || strtotime($user_details_premium['subscription_expiry_date']) > time();
    }
}

if (!$is_premium) {
    $stmt_count = $conn->prepare("SELECT COUNT(*) as list_count FROM shopping_lists WHERE user_id = ?");
    $stmt_count->execute([$user_id]);
    $count_data = $stmt_count->fetch(PDO::FETCH_ASSOC);
    if ($count_data && $count_data['list_count'] >= FREEMIUM_LIST_LIMIT_PHP) {
        send_json_response(['success' => false, 'message' => 'Freemium users can create up to ' . FREEMIUM_LIST_LIMIT_PHP . ' lists. Please upgrade.'], 403); 
    }
}

$list_id = bin2hex(random_bytes(16)); 
$sql = "INSERT INTO shopping_lists (id, user_id, name, budget_limit, default_category) VALUES (?, ?, ?, ?, ?)";
$params = [$list_id, $user_id, $name, $budget_limit, $default_category];

try {
    $stmt_insert = $conn->prepare($sql);
    if ($stmt_insert->execute($params)) {
        $created_list = [
            'id' => $list_id,
            'userId' => $user_id, // Ensure consistency in casing with frontend
            'name' => $name,
            'budgetLimit' => $budget_limit,
            'defaultCategory' => $default_category
        ];
        send_json_response(['success' => true, 'message' => 'List created successfully.', 'list' => $created_list], 201);
    } else {
        // This part is less likely to be reached if PDO is set to throw exceptions.
        $errorInfo = $stmt_insert->errorInfo();
        error_log("Create List DB Error (execute returned false): User ID: {$user_id}, " . implode(" | ", $errorInfo) . " SQL: " . $sql . " Params: " . json_encode($params));
        send_json_response(['success' => false, 'message' => 'Failed to create list (execute returned false). Error: ' . ($errorInfo[2] ?? 'Unknown error')], 500);
    }
} catch (PDOException $e) {
    error_log("Create List DB PDOException: User ID: {$user_id}, Message: " . $e->getMessage() . " SQL: " . $sql . " Params: " . json_encode($params) . " Trace: " . $e->getTraceAsString());
    send_json_response(['success' => false, 'message' => 'Database error creating list.'], 500);
}
?>