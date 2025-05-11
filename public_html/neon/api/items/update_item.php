<?php
// api/items/update_item.php
require_once '../utils.php'; 
handle_options_request(); // Must be called before any output

require_once '../db_config.php';


$user_id = ensure_authenticated();
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    send_json_response(['success' => false, 'message' => 'Invalid input.'], 400);
}

$item_id = sanitize_input($input['id'] ?? ''); // Client sends 'id'
$list_id = sanitize_input($input['listId'] ?? ''); 
$name = sanitize_input($input['name'] ?? '');
$quantity = isset($input['quantity']) ? (int)$input['quantity'] : 1;
$price = isset($input['price']) ? (float)$input['price'] : 0.00;
$category = sanitize_input($input['category'] ?? 'uncategorized');


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
                send_json_response(['success' => false, 'message' => 'Failed to retrieve updated item details.'], 500);
            }
        } else {
            // If no rows affected, data might be the same. Return the current item state.
            $stmt_fetch_current = $conn->prepare("SELECT id, list_id AS listId, user_id AS userId, name, quantity, price, category, checked, date_added AS dateAdded FROM shopping_list_items WHERE id = ?");
            $stmt_fetch_current->execute([$item_id]);
            $current_item_data = $stmt_fetch_current->fetch(PDO::FETCH_ASSOC);
             if ($current_item_data) {
                $current_item_data['quantity'] = (int)$current_item_data['quantity'];
                $current_item_data['price'] = (float)$current_item_data['price'];
                $current_item_data['checked'] = (bool)$current_item_data['checked'];
                $current_item_data['dateAdded'] = (int)$current_item_data['dateAdded'];
                 send_json_response(['success' => true, 'message' => 'No changes made to the item.', 'item' => $current_item_data]);
             } else {
                 send_json_response(['success' => false, 'message' => 'Item not found after update attempt.'], 404);
             }
        }
    } else {
        send_json_response(['success' => false, 'message' => 'Failed to update item.'], 500);
    }
} catch (PDOException $e) {
    error_log("Update Item DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error updating item.'], 500);
}
?>
