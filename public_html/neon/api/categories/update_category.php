<?php
// api/categories/update_category.php
require_once '../utils.php'; 
handle_options_request(); // Must be called before any output

require_once '../db_config.php';


$user_id = ensure_authenticated();
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['id']) || !isset($input['name'])) { 
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
    
    if ($category_data['user_id'] === null) {
        // This is a default category (userId is NULL). Only premium users can edit default categories.
        $is_premium = false;
        $stmt_user = $conn->prepare("SELECT subscription_status, subscription_expiry_date FROM users WHERE id = ?");
        $stmt_user->execute([$user_id]);
        if ($user_details = $stmt_user->fetch(PDO::FETCH_ASSOC)) {
            if ($user_details['subscription_status'] === 'premium') {
                 $is_premium = $user_details['subscription_expiry_date'] === null || strtotime($user_details['subscription_expiry_date']) > time();
            }
        }
        if (!$is_premium) { 
            send_json_response(['success' => false, 'message' => 'Default categories cannot be renamed by freemium users.'], 403);
        }
    } elseif ($category_data['user_id'] !== $user_id) { 
         send_json_response(['success' => false, 'message' => 'Access denied to update this category.'], 403);
    }

    // Check if new name already exists (for this user's custom categories, or globally if editing a default one)
    $stmt_check_name_sql = "SELECT id FROM categories WHERE name = ? AND id != ? AND ";
    if ($category_data['user_id'] === null) { // Editing a default category
        $stmt_check_name_sql .= "(user_id IS NULL)"; // Check against other default categories
    } else { // Editing a user-owned category
        $stmt_check_name_sql .= "(user_id = ?)"; // Check against this user's other custom categories
    }
    
    $stmt_check_name = $conn->prepare($stmt_check_name_sql);
    if ($category_data['user_id'] === null) {
        $stmt_check_name->execute([$name, $category_id]);
    } else {
        $stmt_check_name->execute([$name, $category_id, $user_id]);
    }

    if ($stmt_check_name->fetch()) {
        $message = $category_data['user_id'] === null ? 
                   'Another default category with this name already exists.' :
                   'You already have a custom category with this name.';
        send_json_response(['success' => false, 'message' => $message], 409);
    }
    
    // Actual update query based on ownership
    if ($category_data['user_id'] === null) { // Global category, premium user editing
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
        // This can happen if the name wasn't actually changed
        $current_category_data = ['id' => $category_id, 'userId' => $category_data['user_id'], 'name' => $name]; // Return new name even if no DB change
        send_json_response(['success' => true, 'message' => 'No changes made to the category name.', 'category' => $current_category_data]);
    }
} catch (PDOException $e) {
    error_log("Update Category DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error updating category.'], 500);
}
?>
