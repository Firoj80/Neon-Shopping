
<?php
// api/user/preferences.php
require_once '../db_config.php';
require_once '../utils.php';

handle_options_request();
set_cors_headers();

$user_id = ensure_authenticated();
$conn = get_db_connection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $conn->prepare("SELECT currency_code FROM user_preferences WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $prefs = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($prefs && !empty($prefs['currency_code'])) {
            // Placeholder: Ideally fetch full currency details (symbol, name) from a 'currencies' table
            send_json_response(['success' => true, 'currency' => ['code' => $prefs['currency_code'], 'symbol' => '$', 'name' => $prefs['currency_code']]]);
        } else {
            // No preferences found, client can use its default or auto-detected
            send_json_response(['success' => true, 'currency' => null, 'message' => 'No saved preferences.']);
        }
    } catch (PDOException $e) {
        error_log("Get User Preferences DB Error: " . $e->getMessage());
        send_json_response(['success' => false, 'message' => 'Database error fetching preferences.'], 500);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input || empty($input['currencyCode'])) {
        send_json_response(['success' => false, 'message' => 'Currency code is required.'], 400);
    }
    $currency_code = sanitize_input($input['currencyCode']);

    // Validate currency code (e.g., check against a list of supported codes)
    // For now, we'll assume it's valid.

    try {
        // Check if preferences row exists for the user
        $stmt_check = $conn->prepare("SELECT user_id FROM user_preferences WHERE user_id = ?");
        $stmt_check->execute([$user_id]);

        if ($stmt_check->fetch()) {
            // Update existing preferences
            $stmt_update = $conn->prepare("UPDATE user_preferences SET currency_code = ? WHERE user_id = ?");
            $stmt_update->execute([$currency_code, $user_id]);
        } else {
            // Insert new preferences row
            $stmt_insert = $conn->prepare("INSERT INTO user_preferences (user_id, currency_code) VALUES (?, ?)");
            $stmt_insert->execute([$user_id, $currency_code]);
        }
        // Placeholder: Ideally fetch full currency details
        send_json_response(['success' => true, 'message' => 'Currency preference updated.', 'currency' => ['code' => $currency_code, 'symbol' => '$', 'name' => $currency_code]]);
    } catch (PDOException $e) {
        error_log("Update User Preferences DB Error: " . $e->getMessage());
        send_json_response(['success' => false, 'message' => 'Database error updating preferences.'], 500);
    }
} else {
    send_json_response(['success' => false, 'message' => 'Invalid request method.'], 405);
}

/**
 * SQL for user_preferences table:
 *
CREATE TABLE user_preferences (
    user_id VARCHAR(36) PRIMARY KEY,
    currency_code VARCHAR(3) DEFAULT 'USD', -- Default currency
    -- Add other preferences like theme, notifications_enabled, etc.
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (currency_code) REFERENCES currencies(code) -- If you have a currencies table
);
 *
 * If you don't have a separate `currencies` table, you can remove the foreign key for currency_code.
 * Example for a basic `currencies` table (optional but good for data integrity):
 *
CREATE TABLE currencies (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(10) NOT NULL
);
INSERT INTO currencies (code, name, symbol) VALUES ('USD', 'US Dollar', '$'), ('EUR', 'Euro', '€'), ('INR', 'Indian Rupee', '₹');
-- Add more currencies as needed
 */
?>
