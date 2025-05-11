
<?php
// api/categories/update_category.php
require_once '../utils.php'; 
require_once '../db_config.php';

handle_options_request(); // Must be called before any output
set_cors_headers();       // Must be called before any output

$user_id = ensure_authenticated();
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['id']) || !isset($input['name'])) { // Allow empty name if that's a valid state, but usually not
    send_json_response(['success' => false, 'message' => 'Category ID and name are required.'], 400);
}

$category_id = sanitize_input($input['id']);
$name = sanitize_input($input['name']);

if (empty($name)) {
    send_json_response(['success' => false, 'message' => 'Category name cannot be empty.'], 400);
}

if (strtolower($category_id) === 'uncategorized') {
     send_json_response(['success' => false, 'message' => "'Uncategorized' category cannot be renamed or modified."], 403);
}

try {
    // Verify category ownership
    $stmt_verify = $conn->prepare("SELECT id, user_id FROM categories WHERE id = ?");
    $stmt_verify->execute([$category_id]);
    $category_data = $stmt_verify->fetch(PDO::FETCH_ASSOC);

    if (!$category_data) {
        send_json_response(['success' => false, 'message' => 'Category not found.'], 404);
    }
    
    // Prevent renaming of global/default categories by non-premium users (or any user if desired)
    if ($category_data['user_id'] === null) {
        // Check if user is premium (example logic, adapt to your premium check)
        $is_premium = false;
        $stmt_user = $conn->prepare("SELECT subscription_status, subscription_expiry_date FROM users WHERE id = ?");
        $stmt_user->execute([$user_id]);
        if ($user_details = $stmt_user->fetch(PDO::FETCH_ASSOC)) {
            if ($user_details['subscription_status'] === 'premium') {
                 $is_premium = $user_details['subscription_expiry_date'] === null || strtotime($user_details['subscription_expiry_date']) > time();
            }
        }
        if (!$is_premium) { // Add admin check here if admins can edit them
            send_json_response(['success' => false, 'message' => 'Default categories cannot be renamed by freemium users.'], 403);
        }
    } elseif ($category_data['user_id'] !== $user_id) { // User-owned category, but not by this user
         send_json_response(['success' => false, 'message' => 'Access denied to update this category.'], 403);
    }


    // Check if new name already exists for this user (for their custom categories)
    // Or globally if it's a global category being edited by admin (add admin check)
    $stmt_check_name = $conn->prepare("SELECT id FROM categories WHERE name = ? AND id != ? AND (user_id = ? OR user_id IS NULL)");
    $stmt_check_name->execute([$name, $category_id, $user_id]);
    if ($stmt_check_name->fetch()) {
        send_json_response(['success' => false, 'message' => 'Another category with this name already exists.'], 409);
    }
    
    // Actual update query based on ownership
    if ($category_data['user_id'] === null) { // Global category, admin/premium might edit
        $stmt_update = $conn->prepare("UPDATE categories SET name = ? WHERE id = ? AND user_id IS NULL");
        $stmt_update->execute([$name, $category_id]);
    } else { // User-owned category
        $stmt_update = $conn->prepare("UPDATE categories SET name = ? WHERE id = ? AND user_id = ?");
        $stmt_update->execute([$name, $category_id, $user_id]);
    }
    

    if ($stmt_update->rowCount() > 0) {
        $updated_category = ['id' => $category_id, 'userId' => $category_data['user_id'], 'name' => $name];
        send_json_response(['success' => true, 'message' => 'Category updated successfully.', 'category' => $updated_category]);
    } else {
        // This can happen if the name wasn't actually changed, or if the category didn't match the update criteria (e.g. wrong user_id for user-owned)
        send_json_response(['success' => true, 'message' => 'No changes made to the category name or category not found for update.']);
    }
} catch (PDOException $e) {
    error_log("Update Category DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error updating category.'], 500);
}
?>
