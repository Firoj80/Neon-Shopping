
<?php
// api/categories/delete_category.php
require_once '../db_config.php';
require_once '../utils.php';

handle_options_request();
set_cors_headers();

$user_id = ensure_authenticated();
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['categoryId'])) {
    send_json_response(['success' => false, 'message' => 'Category ID is required.'], 400);
}
$category_id_to_delete = sanitize_input($input['categoryId']);
$reassign_to_id = sanitize_input($input['reassignToId'] ?? 'uncategorized');


// Prevent deletion of 'uncategorized' or predefined default categories by non-premium/non-admin
if (strtolower($category_id_to_delete) === 'uncategorized') {
    send_json_response(['success' => false, 'message' => "'Uncategorized' category cannot be deleted."], 403);
}

// Check if the category to delete is a predefined default (user_id IS NULL)
$stmt_check_default = $conn->prepare("SELECT user_id FROM categories WHERE id = ?");
$stmt_check_default->execute([$category_id_to_delete]);
$category_info = $stmt_check_default->fetch(PDO::FETCH_ASSOC);

if ($category_info && $category_info['user_id'] === null) {
    // This is a predefined default category. Check if user is premium/admin to allow deletion.
    $is_premium = false;
    $stmt_user = $conn->prepare("SELECT subscription_status, subscription_expiry_date FROM users WHERE id = ?");
    $stmt_user->execute([$user_id]);
    if ($user_details = $stmt_user->fetch(PDO::FETCH_ASSOC)) {
        if ($user_details['subscription_status'] === 'premium') {
            $is_premium = $user_details['subscription_expiry_date'] === null || strtotime($user_details['subscription_expiry_date']) > time();
        }
    }
    if (!$is_premium) { // And not an admin
        send_json_response(['success' => false, 'message' => 'Freemium users cannot delete predefined default categories.'], 403);
    }
} elseif ($category_info && $category_info['user_id'] !== $user_id) {
    // Trying to delete a category that belongs to another user
    send_json_response(['success' => false, 'message' => 'Access denied. This category does not belong to you.'], 403);
} elseif (!$category_info) {
    send_json_response(['success' => false, 'message' => 'Category not found.'], 404);
}


try {
    $conn->beginTransaction();

    // Update items associated with the category to be deleted
    $stmt_update_items = $conn->prepare("UPDATE shopping_list_items SET category = ? WHERE category = ? AND user_id = ?");
    $stmt_update_items->execute([$reassign_to_id, $category_id_to_delete, $user_id]);

    // Update default_category in shopping_lists
    $stmt_update_lists = $conn->prepare("UPDATE shopping_lists SET default_category = ? WHERE default_category = ? AND user_id = ?");
    $stmt_update_lists->execute([$reassign_to_id, $category_id_to_delete, $user_id]);
    
    // Delete the category itself (only if it's user-owned or user is admin/premium for default ones)
    // The checks above already handle permission for default categories
    $stmt_delete_category = $conn->prepare("DELETE FROM categories WHERE id = ? AND (user_id = ? OR user_id IS NULL)"); // Allow admin to delete NULL user_id ones if logic permits
    $stmt_delete_category->execute([$category_id_to_delete, $user_id]);


    if ($stmt_delete_category->rowCount() > 0) {
        $conn->commit();
        send_json_response(['success' => true, 'message' => 'Category deleted and items reassigned successfully.']);
    } else {
        $conn->rollBack();
        // This might happen if the category was already deleted or didn't belong to the user (if not a default one)
        send_json_response(['success' => false, 'message' => 'Failed to delete category or category not found for this user.'], 404);
    }
} catch (PDOException $e) {
    $conn->rollBack();
    error_log("Delete Category DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error deleting category.'], 500);
}
?>
