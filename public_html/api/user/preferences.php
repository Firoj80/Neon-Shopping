
<?php
// api/user/preferences.php
require_once '../utils.php'; 
require_once '../db_config.php';

handle_options_request(); // Must be called before any output
set_cors_headers();       // Must be called before any output

$user_id = ensure_authenticated();
$conn = get_db_connection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $conn->prepare("SELECT currency_code FROM user_preferences WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $prefs = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($prefs && !empty($prefs['currency_code'])) {
            // Placeholder: Ideally fetch full currency details (symbol, name) from a 'currencies' table
            // For now, assume client has a map or this basic structure is enough.
            send_json_response(['success' => true, 'currency' => ['code' => $prefs['currency_code'], 'symbol' => '$', 'name' => $prefs['currency_code']]]);
        } else {
            send_json_response(['success' => true, 'currency' => null, 'message' => 'No saved currency preference.']);
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

    // Optional: Validate currency_code against a list of supported codes if you have one in the DB or hardcoded.

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
?>
