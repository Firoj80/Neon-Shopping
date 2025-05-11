
<?php
// api/db_config.php

// **IMPORTANT:** Replace these with your actual database credentials from Hostinger.
$host = 'localhost'; // Or your specific database host provided by Hostinger
$dbname = 'u455934146_neon'; // Your database name
$username = 'u455934146_neon'; // Your database username
$password = 'Babu@8757'; // Your database password
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$dbname;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Throw exceptions on errors
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Fetch associative arrays
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Disable emulation of prepared statements
];

try {
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (PDOException $e) {
    // In a real application, log this error and show a user-friendly message
    // For now, we'll output the error directly for debugging (remove for production)
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit; // Stop execution if connection fails
}

// Function to get the database connection
function get_db_connection() {
    global $pdo; // Use the global PDO object
    return $pdo;
}
?>
