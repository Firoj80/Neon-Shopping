<?php
// api/php/items/add_item.php
require_once '../utils.php';
require_once '../db_config.php';

handle_options_request();
set_cors_headers();

$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

$user_id = get_current_user_id();
if (!$user_id && isset($input['userId'])) {
    $user_id = $input['userId'];
}

if (!$user_id) {
    send_json_response(['success' => false, 'message' => 'User not authenticated.'], 401);
    exit;
}

$list_id = $input['listId'] ?? '';
$name = $input['name'] ?? '';
$quantity = isset($input['quantity']) ? (int)$input['quantity'] : 1;
$price = isset($input['price']) ? (float)$input['price'] : 0.00;
$category = $input['category'] ?? 'uncategorized'; // Ensure this is category ID

if (empty($list_id) || empty($name) || $quantity < 1) {
    send_json_response(['success' => false, 'message' => 'List ID, item name, and valid quantity are required.'], 400);
    exit;
}

// Verify the list belongs to the user
$stmt_verify = $conn->prepare("SELECT id FROM shopping_lists WHERE id = ? AND user_id = ?");
$stmt_verify->bind_param("ss", $list_id, $user_id);
$stmt_verify->execute();
$result_verify = $stmt_verify->get_result();
if ($result_verify->num_rows === 0) {
    send_json_response(['success' => false, 'message' => 'List not found or access denied.'], 404);
    $stmt_verify->close();
    exit;
}
$stmt_verify->close();

$item_id = bin2hex(random_bytes(16));
$date_added = time() * 1000; // Milliseconds timestamp
$checked = false; // New items are unchecked by default

$stmt = $conn->prepare("INSERT INTO shopping_list_items (id, list_id, user_id, name, quantity, price, category, checked, date_added) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssidisi", $item_id, $list_id, $user_id, $name, $quantity, $price, $category, $checked, $date_added);

if ($stmt->execute()) {
    $created_item = [
        'id' => $item_id,
        'listId' => $list_id,
        'userId' => $user_id,
        'name' => $name,
        'quantity' => $quantity,
        'price' => $price,
        'category' => $category,
        'checked' => $checked,
        'dateAdded' => $date_added
    ];
    send_json_response(['success' => true, 'message' => 'Item added successfully.', 'item' => $created_item], 201);
} else {
    error_log("Add Item DB Error: " . $stmt->error);
    send_json_response(['success' => false, 'message' => 'Failed to add item.'], 500);
}

$stmt->close();
$conn->close();
?>
