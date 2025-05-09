<?php
// db_config.php
// IMPORTANT: REPLACE WITH YOUR ACTUAL CREDENTIALS AND KEEP THIS FILE SECURE!
// Consider using environment variables if your hosting supports them for PHP.

define('DB_HOST', 'localhost'); // Or your Hostinger MySQL host
define('DB_USER', 'u455934146_neon');
define('DB_PASS', 'Babu@8757');
define('DB_NAME', 'u455934146_neon');

function get_db_connection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

    if ($conn->connect_error) {
        // Log error securely, don't expose details to client
        error_log("Database Connection Error: " . $conn->connect_error);
        // Send a generic error response
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Database connection failed. Please try again later.']);
        exit; // Terminate script execution
    }
    $conn->set_charset("utf8mb4");
    return $conn;
}
?>
