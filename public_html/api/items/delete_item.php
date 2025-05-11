
<?php
// api/items/delete_item.php
require_once '../utils.php'; 
require_once '../db_config.php';

handle_options_request(); // Must be called before any output
set_cors_headers();       // Must be called before any output

$user_id = ensure_authenticated();
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['itemId'])) {
    send_json_response(['success' => false, 'message' => 'Item ID is required.'], 400);
}
$item_id = sanitize_input($input['itemId']);

try {
    // Verify item ownership before deleting
    $stmt_verify = $conn->prepare("SELECT id FROM shopping_list_items WHERE id = ? AND user_id = ?");
    $stmt_verify->execute([$item_id, $user_id]);
    if (!$stmt_verify->fetch()) {
        send_json_response(['success' => false, 'message' => 'Item not found or access denied.'], 404);
    }

    $stmt_delete = $conn->prepare("DELETE FROM shopping_list_items WHERE id = ? AND user_id = ?");
    if ($stmt_delete->execute([$item_id, $user_id])) {
        if ($stmt_delete->rowCount() > 0) {
            send_json_response(['success' => true, 'message' => 'Item deleted successfully.']);
        } else {
            // This case should ideally be caught by the verify step
            send_json_response(['success' => false, 'message' => 'Failed to delete item or item not found.'], 404); 
        }
    } else {
        send_json_response(['success' => false, 'message' => 'Failed to execute delete operation.'], 500);
    }
} catch (PDOException $e) {
    error_log("Delete Item DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error deleting item.'], 500);
}
?>
