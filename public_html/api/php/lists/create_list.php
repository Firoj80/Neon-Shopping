<?php
// api/php/lists/create_list.php
require_once '../utils.php';
require_once '../db_config.php';

handle_options_request();
set_cors_headers();

$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

$user_id = get_current_user_id(); // Get from session
if (!$user_id && isset($input['userId'])) { // Fallback for direct calls if necessary, ensure auth
    $user_id = $input['userId'];
}

if (!$user_id) {
    send_json_response(['success' => false, 'message' => 'User not authenticated.'], 401);
    exit;
}

$name = $input['name'] ?? '';
$budget_limit = isset($input['budgetLimit']) ? (float)$input['budgetLimit'] : 0.00;
$default_category_id = $input['defaultCategory'] ?? 'uncategorized';

if (empty($name)) {
    send_json_response(['success' => false, 'message' => 'List name is required.'], 400);
    exit;
}

// Check list limit for non-premium users
// You need a way to check if the user is premium. Assuming a column `is_premium` in `users` table.
$stmt_user = $conn->prepare("SELECT is_premium FROM users WHERE id = ?");
$stmt_user->bind_param("s", $user_id);
$stmt_user->execute();
$result_user = $stmt_user->get_result();
$user_details = $result_user->fetch_assoc();
$is_premium = $user_details ? (bool)$user_details['is_premium'] : false;
$stmt_user->close();

if (!$is_premium) {
    $stmt_count = $conn->prepare("SELECT COUNT(*) as list_count FROM shopping_lists WHERE user_id = ?");
    $stmt_count->bind_param("s", $user_id);
    $stmt_count->execute();
    $result_count = $stmt_count->get_result();
    $count_data = $result_count->fetch_assoc();
    $stmt_count->close();
    if ($count_data && $count_data['list_count'] >= 3) { // FREEMIUM_LIST_LIMIT
        send_json_response(['success' => false, 'message' => 'Freemium users can only create up to 3 lists. Please upgrade.'], 403);
        exit;
    }
}


$list_id = bin2hex(random_bytes(16)); // Generate UUID-like ID

$stmt = $conn->prepare("INSERT INTO shopping_lists (id, user_id, name, budget_limit, default_category) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssds", $list_id, $user_id, $name, $budget_limit, $default_category_id);

if ($stmt->execute()) {
    $created_list = [
        'id' => $list_id,
        'userId' => $user_id,
        'name' => $name,
        'budgetLimit' => $budget_limit,
        'defaultCategory' => $default_category_id
    ];
    send_json_response(['success' => true, 'message' => 'List created successfully.', 'list' => $created_list], 201);
} else {
    error_log("Create List DB Error: " . $stmt->error);
    send_json_response(['success' => false, 'message' => 'Failed to create list.'], 500);
}

$stmt->close();
$conn->close();
?>
