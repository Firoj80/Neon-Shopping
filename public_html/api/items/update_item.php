
<?php
// api/items/update_item.php
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

$item_id = sanitize_input($input['id'] ?? '');
$list_id = sanitize_input($input['listId'] ?? ''); // Ensure listId is passed for verification
$name = sanitize_input($input['name'] ?? '');
$quantity = isset($input['quantity']) ? (int)$input['quantity'] : 1;
$price = isset($input['price']) ? (float)$input['price'] : 0.00;
$category = sanitize_input($input['category'] ?? 'uncategorized');
// 'checked' status is handled by toggle_item.php, but could be included here if needed
// 'dateAdded' is generally not updated.

if (empty($item_id) || empty($list_id) || empty($name) || $quantity < 0) {
    send_json_response(['success' => false, 'message' => 'Item ID, List ID, item name, and valid quantity are required.'], 400);
}

try {
    // Verify item ownership and list association
    $stmt_verify = $conn->prepare("SELECT id FROM shopping_list_items WHERE id = ? AND list_id = ? AND user_id = ?");
    $stmt_verify->execute([$item_id, $list_id, $user_id]);
    if (!$stmt_verify->fetch()) {
        send_json_response(['success' => false, 'message' => 'Item not found or access denied.'], 404);
    }

    $stmt_update = $conn->prepare("UPDATE shopping_list_items SET name = ?, quantity = ?, price = ?, category = ? WHERE id = ? AND user_id = ?");
    if ($stmt_update->execute([$name, $quantity, $price, $category, $item_id, $user_id])) {
        if ($stmt_update->rowCount() > 0) {
             // Fetch the updated item to return it, including checked status and dateAdded
            $stmt_fetch = $conn->prepare("SELECT id, list_id AS listId, user_id AS userId, name, quantity, price, category, checked, date_added AS dateAdded FROM shopping_list_items WHERE id = ?");
            $stmt_fetch->execute([$item_id]);
            $updated_item = $stmt_fetch->fetch(PDO::FETCH_ASSOC);

             if ($updated_item) {
                $updated_item['quantity'] = (int)$updated_item['quantity'];
                $updated_item['price'] = (float)$updated_item['price'];
                $updated_item['checked'] = (bool)$updated_item['checked'];
                $updated_item['dateAdded'] = (int)$updated_item['dateAdded'];
                send_json_response(['success' => true, 'message' => 'Item updated successfully.', 'item' => $updated_item]);
            } else {
                send_json_response(['success' => false, 'message' => 'Failed to retrieve updated item.'], 500);
            }
        } else {
            send_json_response(['success' => true, 'message' => 'No changes made to the item.']);
        }
    } else {
        send_json_response(['success' => false, 'message' => 'Failed to update item.'], 500);
    }
} catch (PDOException $e) {
    error_log("Update Item DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error updating item.'], 500);
}
?>
