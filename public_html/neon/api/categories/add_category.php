<?php
// api/categories/add_category.php
require_once '../utils.php'; 
handle_options_request(); // Must be called before any output

require_once '../db_config.php';


$user_id = ensure_authenticated(); 
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['name'])) {
    send_json_response(['success' => false, 'message' => 'Category name is required.'], 400);
}
$name = sanitize_input($input['name']);

$is_premium = false;
$stmt_user = $conn->prepare("SELECT subscription_status, subscription_expiry_date FROM users WHERE id = ?");
$stmt_user->execute([$user_id]);
if ($user_details = $stmt_user->fetch(PDO::FETCH_ASSOC)) {
    if ($user_details['subscription_status'] === 'premium') {
        $is_premium = $user_details['subscription_expiry_date'] === null || strtotime($user_details['subscription_expiry_date']) > time();
    }
}

// Count user-defined categories 
$stmt_cat_count = $conn->prepare("SELECT COUNT(*) as category_count FROM categories WHERE user_id = ?");
$stmt_cat_count->execute([$user_id]);
$cat_count_data = $stmt_cat_count->fetch(PDO::FETCH_ASSOC);
$user_category_count = $cat_count_data ? (int)$cat_count_data['category_count'] : 0;

define('FREEMIUM_CATEGORY_LIMIT_PHP', 5); 

if (!$is_premium && $user_category_count >= FREEMIUM_CATEGORY_LIMIT_PHP) {
    send_json_response(['success' => false, 'message' => 'Freemium users have a limit of ' . FREEMIUM_CATEGORY_LIMIT_PHP . ' custom categories. Please upgrade.'], 403);
}

// Check if category name already exists for this user (custom categories)
try {
    $stmt_check = $conn->prepare("SELECT id FROM categories WHERE name = ? AND user_id = ?");
    $stmt_check->execute([$name, $user_id]);
    if ($stmt_check->fetch()) {
        send_json_response(['success' => false, 'message' => 'You already have a custom category with this name.'], 409);
    }
} catch (PDOException $e) {
     error_log("Add Category - Check Name DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Error checking category name.'], 500);
}


$category_id = bin2hex(random_bytes(16));

try {
    $stmt_insert = $conn->prepare("INSERT INTO categories (id, user_id, name) VALUES (?, ?, ?)");
    if ($stmt_insert->execute([$category_id, $user_id, $name])) {
        $created_category = ['id' => $category_id, 'userId' => $user_id, 'name' => $name];
        send_json_response(['success' => true, 'message' => 'Category added successfully.', 'category' => $created_category], 201);
    } else {
        send_json_response(['success' => false, 'message' => 'Failed to add category.'], 500);
    }
} catch (PDOException $e) {
    error_log("Add Category DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Database error adding category.'], 500);
}
?>
