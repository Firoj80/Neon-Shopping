<?php
// api/php/data/index.php
require_once '../utils.php';
require_once '../db_config.php';

handle_options_request();
set_cors_headers();

$conn = get_db_connection();
$user_id = get_current_user_id();

// If not authenticated via session, check for user_id query parameter (less secure, for initial anonymous state or direct calls if needed)
if (!$user_id && isset($_GET['user_id'])) {
    $user_id = $_GET['user_id']; // Be cautious with this approach, ensure it's only for non-sensitive anonymous data
}

if (!$user_id) {
    send_json_response(['success' => false, 'message' => 'User not authenticated or user_id missing.'], 401);
    exit;
}

$response_data = [
    'lists' => [],
    'items' => [],
    'categories' => [],
    'user_preferences' => [
        'currency' => ['code' => 'USD', 'symbol' => '$', 'name' => 'US Dollar'], // Default, fetch from DB if stored
        'is_premium' => false // Default, fetch from DB if stored
    ]
];

// Fetch Lists
$stmt_lists = $conn->prepare("SELECT id, user_id AS userId, name, budget_limit AS budgetLimit, default_category AS defaultCategory FROM shopping_lists WHERE user_id = ?");
$stmt_lists->bind_param("s", $user_id);
$stmt_lists->execute();
$result_lists = $stmt_lists->get_result();
while ($row = $result_lists->fetch_assoc()) {
    // Ensure numeric types are correct
    $row['budgetLimit'] = (float)$row['budgetLimit'];
    $response_data['lists'][] = $row;
}
$stmt_lists->close();

// Fetch Items (for all lists of the user)
$stmt_items = $conn->prepare("SELECT si.id, si.list_id AS listId, si.user_id AS userId, si.name, si.quantity, si.price, si.category, si.checked, si.date_added AS dateAdded 
                              FROM shopping_list_items si
                              INNER JOIN shopping_lists sl ON si.list_id = sl.id
                              WHERE sl.user_id = ?");
$stmt_items->bind_param("s", $user_id);
$stmt_items->execute();
$result_items = $stmt_items->get_result();
while ($row = $result_items->fetch_assoc()) {
    // Ensure numeric/boolean types are correct
    $row['quantity'] = (int)$row['quantity'];
    $row['price'] = (float)$row['price'];
    $row['checked'] = (bool)$row['checked'];
    $row['dateAdded'] = (int)$row['dateAdded'];
    $response_data['items'][] = $row;
}
$stmt_items->close();

// Fetch Categories (user-specific and default ones)
// Assuming default categories have user_id IS NULL or a specific marker
$stmt_categories = $conn->prepare("SELECT id, user_id AS userId, name FROM categories WHERE user_id = ? OR user_id IS NULL");
$stmt_categories->bind_param("s", $user_id);
$stmt_categories->execute();
$result_categories = $stmt_categories->get_result();
while ($row = $result_categories->fetch_assoc()) {
    $response_data['categories'][] = $row;
}
$stmt_categories->close();


// Fetch User Preferences (currency, premium status) - Example, adjust table/column names as needed
$stmt_prefs = $conn->prepare("SELECT currency_code, is_premium FROM user_preferences WHERE user_id = ?");
if ($stmt_prefs) {
    $stmt_prefs->bind_param("s", $user_id);
    $stmt_prefs->execute();
    $result_prefs = $stmt_prefs->get_result();
    if ($prefs = $result_prefs->fetch_assoc()) {
        // Assuming you have a way to map currency_code to symbol and name
        // This is a simplified example. You might join with a currencies table.
        if ($prefs['currency_code']) {
             // You would typically fetch the full currency details from a 'currencies' table
            $response_data['user_preferences']['currency'] = ['code' => $prefs['currency_code'], 'symbol' => '$', 'name' => $prefs['currency_code']]; // Placeholder symbol/name
        }
        $response_data['user_preferences']['is_premium'] = (bool)$prefs['is_premium'];
    }
    $stmt_prefs->close();
}


send_json_response($response_data);
$conn->close();
?>
