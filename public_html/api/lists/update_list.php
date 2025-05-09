
<?php
// api/lists/update_list.php
require_once '../db_config.php';
require_once '../utils.php';

handle_options_request();
set_cors_headers();

$user_id = ensure_authenticated();
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    send_json_response(['success' => false, 'message' => 'Invalid input.'], 400);
}

$list_id = sanitize_input($input['id'] ?? '');
$name = sanitize_input($input['name'] ?? '');
$budget_limit = isset($input['budgetLimit']) ? (float)$input['budgetLimit'] : 0.00;
$default_category = sanitize_input($input['defaultCategory'] ?? 'uncategorized');

if (empty($list_id) || empty($name)) {
    send_json_response(['success' => false, 'message' => 'List ID and name are required.'], 400);
}

try {
    // Verify list ownership
    $stmt_verify = $conn->prepare("SELECT id FROM shopping_lists WHERE id = ? AND user_id = ?");
    $stmt_verify->execute([$list_id, $user_id]);
    if (!$stmt_verify->fetch()) {
        send_json_response(['success' => false, 'message' => 'List not found or access denied.'], 404);
    }

    $stmt_update = $conn->prepare("UPDATE shopping_lists SET name = ?, budget_limit = ?, default_category = ? WHERE id = ? AND user_id = ?");
    if ($stmt_update->execute([$name, $budget_limit, $default_category, $list_id, $user_id])) {
        if ($stmt_update->rowCount() > 0) {
            $updated_list = [
                'id' => $list_id,
                'userId' => $user_id,
                'name' => $name,
                'budgetLimit' => $budget_limit,
                'defaultCategory' => $default_category
            ];
            send_json_response(['success' => true, 'message' => 'List updated successfully.', 'list' => $updated_list]);
        } else {
            // No rows affected, could mean data was the same or list not found (though verified)
            send_json_response(['success' => true, 'message' => 'No changes made to the list or list not found.']);
        }
    } else {
        send_json_response(['success' => false, 'message' => 'Failed to update list.'], 500);
    }
} catch (PDOException $e) {
    error_log("Update List DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error updating list.'], 500);
}
?>
