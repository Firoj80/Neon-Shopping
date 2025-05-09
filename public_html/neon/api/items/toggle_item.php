<?php
// api/items/toggle_item.php
require_once '../utils.php'; 
handle_options_request(); // Must be called before any output

require_once '../db_config.php';


$user_id = ensure_authenticated();
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['itemId'])) {
    send_json_response(['success' => false, 'message' => 'Item ID is required.'], 400);
}
$item_id = sanitize_input($input['itemId']);
$date_updated = round(microtime(true) * 1000); 

try {
    // Verify item ownership
    $stmt_verify = $conn->prepare("SELECT checked FROM shopping_list_items WHERE id = ? AND user_id = ?");
    $stmt_verify->execute([$item_id, $user_id]);
    $item = $stmt_verify->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        send_json_response(['success' => false, 'message' => 'Item not found or access denied.'], 404);
    }

    $new_checked_status = !$item['checked']; 

    // Update the checked status and date_added (which is more like date_modified_for_check_status)
    $stmt_update = $conn->prepare("UPDATE shopping_list_items SET checked = ?, date_added = ? WHERE id = ? AND user_id = ?");
    if ($stmt_update->execute([$new_checked_status, $date_updated, $item_id, $user_id])) {
        if ($stmt_update->rowCount() > 0) {
            send_json_response(['success' => true, 'message' => 'Item status toggled successfully.', 'checked' => $new_checked_status, 'dateAdded' => $date_updated]);
        } else {
            // Should not happen if verify passed and status is actually different.
            // Could happen if client sends multiple toggle requests rapidly.
             send_json_response(['success' => true, 'message' => 'No change in item status or item not found for update.', 'checked' => $item['checked'], 'dateAdded' => $item['date_added'] ?? $date_updated]); 
        }
    } else {
        send_json_response(['success' => false, 'message' => 'Failed to toggle item status.'], 500);
    }
} catch (PDOException $e) {
    error_log("Toggle Item DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error toggling item status.'], 500);
}
?>
