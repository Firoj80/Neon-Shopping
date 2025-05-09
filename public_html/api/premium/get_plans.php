
<?php
// api/premium/get_plans.php
require_once '../db_config.php';
require_once '../utils.php';

handle_options_request();
set_cors_headers();
// No authentication needed to view plans

$conn = get_db_connection();

try {
    // Assuming you have a table named 'premium_plans'
    // id (VARCHAR/UUID), name (VARCHAR), price_monthly (DECIMAL), price_yearly (DECIMAL), description (TEXT), features (TEXT, comma-separated)
    $stmt = $conn->prepare("SELECT id, name, price_monthly, price_yearly, description, features FROM premium_plans WHERE is_active = TRUE ORDER BY display_order ASC");
    $stmt->execute();
    $plans = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formatted_plans = [];
    foreach ($plans as $plan) {
        $formatted_plans[] = [
            'id' => $plan['id'],
            'name' => $plan['name'],
            'priceMonthly' => $plan['price_monthly'] ? (float)$plan['price_monthly'] : null,
            'priceYearly' => $plan['price_yearly'] ? (float)$plan['price_yearly'] : null,
            'description' => $plan['description'],
            'features' => explode(',', $plan['features']) // Convert comma-separated string to array
        ];
    }

    send_json_response(['success' => true, 'plans' => $formatted_plans]);

} catch (PDOException $e) {
    error_log("Get Plans DB Error: " . $e->getMessage());
    send_json_response(['success' => false, 'message' => 'Failed to retrieve premium plans.'], 500);
}

/**
 * SQL for premium_plans table:
 *
CREATE TABLE premium_plans (
    id VARCHAR(50) PRIMARY KEY,          -- e.g., 'monthly', 'yearly'
    name VARCHAR(255) NOT NULL,
    price_monthly DECIMAL(10, 2) NULL,   -- Null if not applicable
    price_yearly DECIMAL(10, 2) NULL,    -- Null if not applicable
    description TEXT,
    features TEXT,                       -- Comma-separated list of feature keys or descriptions
    is_active BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0
);

INSERT INTO premium_plans (id, name, price_monthly, price_yearly, description, features, display_order) VALUES
('monthly_basic', 'Monthly', 5.99, NULL, 'Access all premium features, billed monthly.', 'no_ads,dashboard_access,purchase_history,export_records,unlimited_lists,unlimited_categories,all_themes', 10),
('three_month_standard', '3 Months', 15.00, NULL, 'Save with a quarterly plan.', 'no_ads,dashboard_access,purchase_history,export_records,unlimited_lists,unlimited_categories,all_themes', 20),
('yearly_premium', 'Yearly', NULL, 48.00, 'Best value! Access all premium features, billed annually.', 'no_ads,dashboard_access,purchase_history,export_records,unlimited_lists,unlimited_categories,all_themes', 30);
 *
 */
?>
