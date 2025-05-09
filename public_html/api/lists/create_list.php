
<?php
// api/lists/create_list.php
require_once '../utils.php'; 
require_once '../db_config.php';

define('FREEMIUM_LIST_LIMIT_PHP', 3); 

handle_options_request(); // Must be called before any output
set_cors_headers();       // Must be called before any output

$user_id = ensure_authenticated();
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    send_json_response(['success' => false, 'message' => 'Invalid input.'], 400);
}

$name = sanitize_input($input['name'] ?? '');
$budget_limit = isset($input['budgetLimit']) ? (float)$input['budgetLimit'] : 0.00;
$default_category = sanitize_input($input['defaultCategory'] ?? 'uncategorized');

if (empty($name)) {
    send_json_response(['success' => false, 'message' => 'List name is required.'], 400);
}

// Check list limit for non-premium users
$is_premium = false; 
$stmt_user = $conn->prepare("SELECT subscription_status, subscription_expiry_date FROM users WHERE id = ?");
$stmt_user->execute([$user_id]);
if ($user_details = $stmt_user->fetch(PDO::FETCH_ASSOC)) {
    if ($user_details['subscription_status'] === 'premium') {
        $is_premium = $user_details['subscription_expiry_date'] === null || strtotime($user_details['subscription_expiry_date']) > time();
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

try {
    $stmt_insert = $conn->prepare("INSERT INTO shopping_lists (id, user_id, name, budget_limit, default_category) VALUES (?, ?, ?, ?, ?)");
    if ($stmt_insert->execute([$list_id, $user_id, $name, $budget_limit, $default_category])) {
        $created_list = [
            'id' => $list_id,
            'userId' => $user_id,
            'name' => $name,
            'budgetLimit' => $budget_limit,
            'defaultCategory' => $default_category
        ];
        send_json_response(['success' => true, 'message' => 'List created successfully.', 'list' => $created_list], 201);
    } else {
        send_json_response(['success' => false, 'message' => 'Failed to create list.'], 500);
    }
} catch (PDOException $e) {
    error_log("Create List DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error creating list.'], 500);
}
?>
