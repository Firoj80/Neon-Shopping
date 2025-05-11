
<?php
// api/categories/delete_category.php
require_once '../utils.php'; 
require_once '../db_config.php';

handle_options_request(); // Must be called before any output
set_cors_headers();       // Must be called before any output

$user_id = ensure_authenticated();
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['categoryId'])) {
    send_json_response(['success' => false, 'message' => 'Category ID is required.'], 400);
}
$category_id_to_delete = sanitize_input($input['categoryId']);
$reassign_to_id = sanitize_input($input['reassignToId'] ?? 'uncategorized');


if (strtolower($category_id_to_delete) === 'uncategorized') {
    send_json_response(['success' => false, 'message' => "'Uncategorized' category cannot be deleted."], 403);
}

$stmt_check_category = $conn->prepare("SELECT user_id, name FROM categories WHERE id = ?");
$stmt_check_category->execute([$category_id_to_delete]);
$category_info = $stmt_check_category->fetch(PDO::FETCH_ASSOC);

if (!$category_info) {
    send_json_response(['success' => false, 'message' => 'Category not found.'], 404);
}

// Check if it's a predefined default category (user_id IS NULL)
if ($category_info['user_id'] === null) {
    $is_premium = false; // Check actual premium status
    $stmt_user = $conn->prepare("SELECT subscription_status, subscription_expiry_date FROM users WHERE id = ?");
    $stmt_user->execute([$user_id]);
    if ($user_details = $stmt_user->fetch(PDO::FETCH_ASSOC)) {
        if ($user_details['subscription_status'] === 'premium') {
            $is_premium = $user_details['subscription_expiry_date'] === null || strtotime($user_details['subscription_expiry_date']) > time();
        }
    }
    if (!$is_premium) { 
        send_json_response(['success' => false, 'message' => 'Freemium users cannot delete predefined default categories.'], 403);
    }
} elseif ($category_info['user_id'] !== $user_id) {
    // Trying to delete a category that belongs to another user (should not happen with proper client-side logic)
    send_json_response(['success' => false, 'message' => 'Access denied. This category does not belong to you.'], 403);
}


try {
    $conn->beginTransaction();

    // Update items associated with the category to be deleted
    $stmt_update_items = $conn->prepare("UPDATE shopping_list_items SET category = ? WHERE category = ? AND user_id = ?");
    $stmt_update_items->execute([$reassign_to_id, $category_id_to_delete, $user_id]);

    // Update default_category in shopping_lists
    $stmt_update_lists = $conn->prepare("UPDATE shopping_lists SET default_category = ? WHERE default_category = ? AND user_id = ?");
    $stmt_update_lists->execute([$reassign_to_id, $category_id_to_delete, $user_id]);
    
    // Determine ownership for delete query
    if ($category_info['user_id'] === null) { // Global default category
        $stmt_delete_category = $conn->prepare("DELETE FROM categories WHERE id = ? AND user_id IS NULL");
        $stmt_delete_category->execute([$category_id_to_delete]);
    } else { // User-owned category
        $stmt_delete_category = $conn->prepare("DELETE FROM categories WHERE id = ? AND user_id = ?");
        $stmt_delete_category->execute([$category_id_to_delete, $user_id]);
    }


    if ($stmt_delete_category->rowCount() > 0) {
        $conn->commit();
        send_json_response(['success' => true, 'message' => 'Category deleted and items reassigned successfully.']);
    } else {
        $conn->rollBack();
        send_json_response(['success' => false, 'message' => 'Failed to delete category. It might have been already deleted or not found.'], 404);
    }
} catch (PDOException $e) {
    $conn->rollBack();
    error_log("Delete Category DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error deleting category.'], 500);
}
?>
