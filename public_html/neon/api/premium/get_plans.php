<?php
// api/premium/get_plans.php
require_once '../utils.php'; 
handle_options_request(); // Must be called before any output

require_once '../db_config.php';


// No authentication needed to view plans, but good to include utils for consistency
$conn = get_db_connection();

try {
    // Fetch only active plans, ordered by display_order if you have such a column
    $stmt = $conn->prepare("SELECT id, name, price_monthly, price_yearly, description, features FROM premium_plans WHERE is_active = TRUE ORDER BY display_order ASC");
    $stmt->execute();
    $plans_raw = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formatted_plans = [];
    foreach ($plans_raw as $plan) {
        $formatted_plans[] = [
            'id' => $plan['id'],
            'name' => $plan['name'],
            // Ensure prices are floats or null
            'priceMonthly' => $plan['price_monthly'] ? (float)$plan['price_monthly'] : null,
            'priceYearly' => $plan['price_yearly'] ? (float)$plan['price_yearly'] : null,
            'description' => $plan['description'],
            // Ensure features are an array, even if empty
            'features' => !empty($plan['features']) ? array_map('trim', explode(',', $plan['features'])) : [] 
        ];
    }

    send_json_response(['success' => true, 'plans' => $formatted_plans]);

} catch (PDOException $e) {
    error_log("Get Plans DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Failed to retrieve premium plans.'], 500);
}
?>
