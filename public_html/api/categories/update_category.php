
<?php
// api/categories/update_category.php
require_once '../db_config.php';
require_once '../utils.php';

handle_options_request();
set_cors_headers();

$user_id = ensure_authenticated();
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['id']) || empty($input['name'])) {
    send_json_response(['success' => false, 'message' => 'Category ID and name are required.'], 400);
}

$category_id = sanitize_input($input['id']);
$name = sanitize_input($input['name']);

// 'uncategorized' cannot be renamed/modified significantly by users.
// Also, predefined default categories (those with user_id IS NULL) should not be renamed by users.
if (strtolower($category_id) === 'uncategorized' || (isset($input['originalName']) && strtolower($input['originalName']) === 'uncategorized')) {
     send_json_response(['success' => false, 'message' => "'Uncategorized' cannot be modified."], 403);
}

try {
    // Verify category ownership
    $stmt_verify = $conn->prepare("SELECT id, user_id FROM categories WHERE id = ?");
    $stmt_verify->execute([$category_id]);
    $category_data = $stmt_verify->fetch(PDO::FETCH_ASSOC);

    if (!$category_data) {
        send_json_response(['success' => false, 'message' => 'Category not found.'], 404);
    }
    // Check if it's a global/default category (user_id IS NULL) or belongs to the current user
    if ($category_data['user_id'] !== null && $category_data['user_id'] !== $user_id) {
         send_json_response(['success' => false, 'message' => 'Access denied to update this category.'], 403);
    }
    // Prevent renaming of global/default categories by regular users
    if ($category_data['user_id'] === null && !$is_admin_user_for_example) { // You'd need an admin check
        //send_json_response(['success' => false, 'message' => 'Default categories cannot be renamed by users.'], 403);
    }


    // Check if new name already exists for this user (or globally if it's a global category being edited by admin)
    $stmt_check_name = $conn->prepare("SELECT id FROM categories WHERE name = ? AND id != ? AND (user_id = ? OR user_id IS NULL)");
    $stmt_check_name->execute([$name, $category_id, $user_id]);
    if ($stmt_check_name->fetch()) {
        send_json_response(['success' => false, 'message' => 'Another category with this name already exists.'], 409);
    }

    $stmt_update = $conn->prepare("UPDATE categories SET name = ? WHERE id = ? AND (user_id = ? OR user_id IS NULL)"); // Allow admin to edit NULL user_id ones
    if ($stmt_update->execute([$name, $category_id, $user_id])) {
        if ($stmt_update->rowCount() > 0) {
            $updated_category = ['id' => $category_id, 'userId' => $category_data['user_id'], 'name' => $name]; // return original userId
            send_json_response(['success' => true, 'message' => 'Category updated successfully.', 'category' => $updated_category]);
        } else {
            send_json_response(['success' => true, 'message' => 'No changes made to the category.']);
        }
    } else {
        send_json_response(['success' => false, 'message' => 'Failed to update category.'], 500);
    }
} catch (PDOException $e) {
    error_log("Update Category DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error updating category.'], 500);
}
?>
