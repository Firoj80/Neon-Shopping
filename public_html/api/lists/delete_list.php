
<?php
// api/lists/delete_list.php
require_once '../utils.php'; 
require_once '../db_config.php';

handle_options_request(); // Must be called before any output
set_cors_headers();       // Must be called before any output

$user_id = ensure_authenticated();
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['listId'])) {
    send_json_response(['success' => false, 'message' => 'List ID is required.'], 400);
}
$list_id = sanitize_input($input['listId']);

try {
    $conn->beginTransaction();

    // Verify list ownership before deleting items
    $stmt_verify = $conn->prepare("SELECT id FROM shopping_lists WHERE id = ? AND user_id = ?");
    $stmt_verify->execute([$list_id, $user_id]);
    if (!$stmt_verify->fetch()) {
        $conn->rollBack();
        send_json_response(['success' => false, 'message' => 'List not found or access denied.'], 404);
    }

    // Delete items associated with the list
    $stmt_delete_items = $conn->prepare("DELETE FROM shopping_list_items WHERE list_id = ? AND user_id = ?");
    $stmt_delete_items->execute([$list_id, $user_id]);

    // Delete the list itself
    $stmt_delete_list = $conn->prepare("DELETE FROM shopping_lists WHERE id = ? AND user_id = ?");
    $stmt_delete_list->execute([$list_id, $user_id]);

    if ($stmt_delete_list->rowCount() > 0) {
        $conn->commit();
        send_json_response(['success' => true, 'message' => 'List and its items deleted successfully.']);
    } else {
        $conn->rollBack(); 
        send_json_response(['success' => false, 'message' => 'Failed to delete list or list not found.'], 404);
    }
} catch (PDOException $e) {
    $conn->rollBack();
    error_log("Delete List DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error deleting list.'], 500);
}
?>
