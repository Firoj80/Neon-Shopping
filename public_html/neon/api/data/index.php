<?php
// api/data/index.php
require_once '../utils.php'; 
handle_options_request(); // Must be called before any output (including db_config if it outputs on error)

require_once '../db_config.php';


$user_id = ensure_authenticated(); // Ensures user is logged in, or script exits
$conn = get_db_connection();

$response_data = [
    'lists' => [],
    'items' => [],
    'categories' => [],
    'user_preferences' => [ 
        'currency' => ['code' => 'USD', 'symbol' => '$', 'name' => 'US Dollar'], // Default, will be overridden
        'is_premium' => false // Default, will be overridden
    ]
];

try {
    // Fetch Lists for the user
    $stmt_lists = $conn->prepare("SELECT id, name, budget_limit AS budgetLimit, default_category AS defaultCategory FROM shopping_lists WHERE user_id = ?");
    $stmt_lists->execute([$user_id]);
    while ($row = $stmt_lists->fetch(PDO::FETCH_ASSOC)) {
        $row['budgetLimit'] = (float)($row['budgetLimit'] ?? 0.00); // Ensure numeric type, default to 0.00 if null
        $row['userId'] = $user_id; 
        $response_data['lists'][] = $row;
    }

    // Fetch Items for all lists of the user
    $stmt_items = $conn->prepare("SELECT id, list_id AS listId, name, quantity, price, category, checked, date_added AS dateAdded FROM shopping_list_items WHERE user_id = ?");
    $stmt_items->execute([$user_id]);
    while ($row = $stmt_items->fetch(PDO::FETCH_ASSOC)) {
        $row['quantity'] = (int)($row['quantity'] ?? 1);
        $row['price'] = (float)($row['price'] ?? 0.00);
        $row['checked'] = (bool)($row['checked'] ?? false);
        $row['dateAdded'] = (int)($row['dateAdded'] ?? 0); 
        $row['userId'] = $user_id; 
        $response_data['items'][] = $row;
    }

    // Fetch Categories (user-specific and default/global ones if any)
    // User specific categories will have user_id = current user_id
    // Default categories will have user_id IS NULL
    $stmt_categories = $conn->prepare("SELECT id, user_id AS userId, name FROM categories WHERE user_id = ? OR user_id IS NULL");
    $stmt_categories->execute([$user_id]);
    while ($row = $stmt_categories->fetch(PDO::FETCH_ASSOC)) {
        $response_data['categories'][] = $row;
    }
    
    // Fetch User Preferences (is_premium from users table)
    $stmt_user_details = $conn->prepare("SELECT subscription_status, subscription_expiry_date FROM users WHERE id = ?");
    $stmt_user_details->execute([$user_id]);
    if ($user_details = $stmt_user_details->fetch(PDO::FETCH_ASSOC)) {
        if ($user_details['subscription_status'] === 'premium') {
             $response_data['user_preferences']['is_premium'] = $user_details['subscription_expiry_date'] === null || strtotime($user_details['subscription_expiry_date']) > time();
        } else {
            $response_data['user_preferences']['is_premium'] = false;
        }
    }
     // Fetch currency preference from user_preferences table (if exists)
    $stmt_prefs_currency = $conn->prepare("SELECT currency_code FROM user_preferences WHERE user_id = ?");
    $stmt_prefs_currency->execute([$user_id]);
    if ($prefs_currency = $stmt_prefs_currency->fetch(PDO::FETCH_ASSOC)) {
        if (!empty($prefs_currency['currency_code'])) {
             // You might join with a currencies table here or have a predefined map
            // For now, just setting the code. Client should have mapping for symbol/name.
            $response_data['user_preferences']['currency'] = ['code' => $prefs_currency['currency_code'], 'symbol' => '$', 'name' => $prefs_currency['currency_code']]; // Placeholder symbol/name
        }
    }


    send_json_response(['success' => true, 'data' => $response_data]);

} catch (PDOException $e) {
    error_log("Fetch Data DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Failed to fetch app data.', 'error' => $e->getMessage()], 500);
}
?>
