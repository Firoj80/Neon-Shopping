
<?php
// api/categories/add_category.php
require_once '../db_config.php';
require_once '../utils.php';

handle_options_request();
set_cors_headers();

$user_id = ensure_authenticated(); // Categories are user-specific
$conn = get_db_connection();
$input = json_decode(file_get_contents('php://input'), true);

if (!$input || empty($input['name'])) {
    send_json_response(['success' => false, 'message' => 'Category name is required.'], 400);
}
$name = sanitize_input($input['name']);

// Freemium check for custom categories (if defaults are considered separate)
// Assuming default categories are marked with user_id IS NULL or a specific system ID
// and 'uncategorized' is always allowed.
$is_premium = false;
$stmt_user = $conn->prepare("SELECT subscription_status, subscription_expiry_date FROM users WHERE id = ?");
$stmt_user->execute([$user_id]);
if ($user_details = $stmt_user->fetch(PDO::FETCH_ASSOC)) {
    if ($user_details['subscription_status'] === 'premium') {
        $is_premium = $user_details['subscription_expiry_date'] === null || strtotime($user_details['subscription_expiry_date']) > time();
    }
}

// Count user-defined categories (excluding global/default ones if any)
$stmt_cat_count = $conn->prepare("SELECT COUNT(*) as category_count FROM categories WHERE user_id = ?");
$stmt_cat_count->execute([$user_id]);
$cat_count_data = $stmt_cat_count->fetch(PDO::FETCH_ASSOC);
$user_category_count = $cat_count_data ? (int)$cat_count_data['category_count'] : 0;

// Example: Allow up to 5 custom categories for freemium users
// (DEFAULT_CATEGORIES constant is from frontend, server needs its own logic or constant)
define('FREEMIUM_CATEGORY_LIMIT', 5); // Define this based on your app's logic

if (!$is_premium && $user_category_count >= FREEMIUM_CATEGORY_LIMIT) {
    // Check if the category name matches one of the predefined default names (case-insensitive)
    // This list should ideally be managed consistently between frontend and backend
    $default_category_names = ['Home Appliances', 'Health', 'Grocery', 'Fashion', 'Electronics']; // Example
    $is_trying_to_add_default = false;
    foreach ($default_category_names as $default_name) {
        if (strtolower($name) === strtolower($default_name)) {
            $is_trying_to_add_default = true;
            break;
        }
    }
    // If limit reached and not trying to add a known default (which shouldn't happen if they are pre-created with NULL user_id)
    if (!$is_trying_to_add_default) {
         send_json_response(['success' => false, 'message' => 'Freemium users have a limit of ' . FREEMIUM_CATEGORY_LIMIT . ' custom categories. Please upgrade.'], 403);
    }
}


// Check if category name already exists for this user
try {
    $stmt_check = $conn->prepare("SELECT id FROM categories WHERE name = ? AND (user_id = ? OR user_id IS NULL)");
    $stmt_check->execute([$name, $user_id]);
    if ($stmt_check->fetch()) {
        send_json_response(['success' => false, 'message' => 'Category name already exists.'], 409);
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
