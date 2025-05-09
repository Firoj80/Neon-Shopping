<?php
// public_html/api/razorpay_config.php

// ** IMPORTANT: Replace these with your ACTUAL Razorpay Test or Live Keys **
// It's highly recommended to use environment variables or a more secure
// configuration management method in a production environment.
// For shared hosting, this might be a common approach, but be mindful of security.

define('RAZORPAY_KEY_ID', 'YOUR_RAZORPAY_KEY_ID'); // Replace with your Key ID
define('RAZORPAY_KEY_SECRET', 'YOUR_RAZORPAY_KEY_SECRET'); // Replace with your Key Secret

// Set to false for live mode
define('RAZORPAY_TEST_MODE', true);

// Example: If you store keys in a file outside the web root (more secure)
// and include it, ensure the path is correct and the file is not web-accessible.
// $config_path = __DIR__ . '/../../razorpay_secure_keys.php';
// if (file_exists($config_path)) {
//     require_once $config_path;
// } else {
//     // Fallback or error if keys are not found
//     // For this example, we'll use the defines above.
// }
?>