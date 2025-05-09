
<?php
// api/data/index.php
require_once '../db_config.php';
require_once '../utils.php';

handle_options_request();
set_cors_headers();

$user_id = ensure_authenticated(); // Ensures user is logged in, or script exits
$conn = get_db_connection();

$response_data = [
    'lists' => [],
    'items' => [],
    'categories' => [],
    'user_preferences' => [ // Default user preferences, will be overridden if found in DB
        'currency' => ['code' => 'USD', 'symbol' => '$', 'name' => 'US Dollar'],
        'is_premium' => false
    ]
];

try {
    // Fetch Lists for the user
    $stmt_lists = $conn->prepare("SELECT id, name, budget_limit AS budgetLimit, default_category AS defaultCategory FROM shopping_lists WHERE user_id = ?");
    $stmt_lists->execute([$user_id]);
    while ($row = $stmt_lists->fetch(PDO::FETCH_ASSOC)) {
        $row['budgetLimit'] = (float)$row['budgetLimit']; // Ensure numeric type
        $row['userId'] = $user_id; // Add userId for consistency with frontend models
        $response_data['lists'][] = $row;
    }

    // Fetch Items for all lists of the user
    $stmt_items = $conn->prepare("SELECT id, list_id AS listId, name, quantity, price, category, checked, date_added AS dateAdded FROM shopping_list_items WHERE user_id = ?");
    $stmt_items->execute([$user_id]);
    while ($row = $stmt_items->fetch(PDO::FETCH_ASSOC)) {
        $row['quantity'] = (int)$row['quantity'];
        $row['price'] = (float)$row['price'];
        $row['checked'] = (bool)$row['checked'];
        $row['dateAdded'] = (int)$row['dateAdded']; // Ensure numeric type
        $row['userId'] = $user_id; // Add userId
        $response_data['items'][] = $row;
    }

    // Fetch Categories (user-specific and default/global ones if any)
    // Assuming default categories have user_id IS NULL or a specific marker like 'SYSTEM_DEFAULT'
    // For this example, let's fetch only user-specific categories and client-side can merge with its defaults if needed.
    // Or, store default categories with a NULL user_id and fetch them too.
    $stmt_categories = $conn->prepare("SELECT id, name FROM categories WHERE user_id = ? OR user_id IS NULL");
    $stmt_categories->execute([$user_id]);
    while ($row = $stmt_categories->fetch(PDO::FETCH_ASSOC)) {
         $row['userId'] = $user_id; // Or keep it null for global ones
        $response_data['categories'][] = $row;
    }

    // Fetch User Preferences (currency, premium status)
    $stmt_prefs = $conn->prepare("SELECT currency_code, is_premium FROM user_preferences WHERE user_id = ?");
    $stmt_prefs->execute([$user_id]);
    if ($prefs = $stmt_prefs->fetch(PDO::FETCH_ASSOC)) {
        if (!empty($prefs['currency_code'])) {
            // Ideally, join with a currencies table to get symbol and name
            // For simplicity, we'll assume a helper function or hardcoded map on client/server
            // This is a placeholder, adjust how you map currency code to symbol and name
            $response_data['user_preferences']['currency'] = ['code' => $prefs['currency_code'], 'symbol' => '$', 'name' => $prefs['currency_code']]; // Example
        }
        $response_data['user_preferences']['is_premium'] = (bool)$prefs['is_premium'];
    } else {
        // If no preferences row exists, check subscription status from users table
        $stmt_user = $conn->prepare("SELECT subscription_status, subscription_expiry_date FROM users WHERE id = ?");
        $stmt_user->execute([$user_id]);
        if ($user_details = $stmt_user->fetch(PDO::FETCH_ASSOC)) {
            if ($user_details['subscription_status'] === 'premium') {
                 $response_data['user_preferences']['is_premium'] = $user_details['subscription_expiry_date'] === null || strtotime($user_details['subscription_expiry_date']) > time();
            }
        }
    }


    send_json_response(['success' => true, 'data' => $response_data]);

} catch (PDOException $e) {
    error_log("Fetch Data DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Failed to fetch app data.', 'error' => $e->getMessage()], 500);
}
?>
