
<?php
// api/items/add_item.php
require_once '../utils.php'; 
require_once '../db_config.php';

handle_options_request(); // Must be called before any output
set_cors_headers();       // Must be called before any output

$user_id = ensure_authenticated();
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    send_json_response(['success' => false, 'message' => 'Invalid input.'], 400);
}

$list_id = sanitize_input($input['listId'] ?? '');
$name = sanitize_input($input['name'] ?? '');
$quantity = isset($input['quantity']) ? (int)$input['quantity'] : 1;
$price = isset($input['price']) ? (float)$input['price'] : 0.00;
$category = sanitize_input($input['category'] ?? 'uncategorized'); 
$checked = false; 
$date_added = round(microtime(true) * 1000); 

if (empty($list_id) || empty($name) || $quantity < 0) { 
    send_json_response(['success' => false, 'message' => 'List ID, item name, and valid quantity are required.'], 400);
}

// Verify the list belongs to the user
try {
    $stmt_verify = $conn->prepare("SELECT id FROM shopping_lists WHERE id = ? AND user_id = ?");
    $stmt_verify->execute([$list_id, $user_id]);
    if (!$stmt_verify->fetch()) {
        send_json_response(['success' => false, 'message' => 'List not found or access denied.'], 404);
    }
} catch (PDOException $e) {
    error_log("Add Item - Verify List DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Error verifying list ownership.'], 500);
}

$item_id = bin2hex(random_bytes(16)); 

try {
    $stmt_insert = $conn->prepare("INSERT INTO shopping_list_items (id, list_id, user_id, name, quantity, price, category, checked, date_added) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    if ($stmt_insert->execute([$item_id, $list_id, $user_id, $name, $quantity, $price, $category, $checked, $date_added])) {
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
        send_json_response(['success' => false, 'message' => 'Failed to add item.'], 500);
    }
} catch (PDOException $e) {
    error_log("Add Item DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error adding item.'], 500);
}
?>
