<?php
// public_html/api/razorpay_config.php
// This file primarily defines constants, so handle_options_request() isn't strictly necessary
// unless this file itself was an endpoint that could receive OPTIONS requests.
// However, including utils.php might be useful if you add functions here later.
// require_once __DIR__ . '/utils.php'; // If you plan to add executable logic
// handle_options_request();


// ** IMPORTANT: Replace these with your ACTUAL Razorpay Test or Live Keys **
// It's highly recommended to use environment variables or a more secure
// configuration management method in a production environment.
// For shared hosting, defines are common but ensure this file is NOT web-accessible if possible,
// or place it outside the web root and include it.

// For testing, use your Razorpay Test Keys.
// For production, use your Razorpay Live Keys.

// --- IMPORTANT ---
// Replace 'YOUR_RAZORPAY_KEY_ID' and 'YOUR_RAZORPAY_KEY_SECRET' with your actual keys.
// Keep these confidential, especially the Key Secret.
// Consider using environment variables in a production server environment if possible.
// For shared hosting where .env files might not be standard for PHP, 
// you might place this file (or a similar one with defines) outside the webroot 
// and include it, or ensure strict .htaccess rules prevent direct access to it.

define('RAZORPAY_KEY_ID', 'YOUR_RAZORPAY_KEY_ID'); // Replace with your Key ID
define('RAZORPAY_KEY_SECRET', 'YOUR_RAZORPAY_KEY_SECRET'); // Replace with your Key Secret

// Set to false for live mode, true for test mode
// This setting itself doesn't directly control Razorpay's mode but can be used in your logic
// (e.g., to conditionally use test/live keys if you store both).
// Razorpay's mode is primarily determined by the keys (test keys for test mode, live keys for live mode).
define('RAZORPAY_IN_TEST_MODE', true); 

// Webhook Secret (Optional but Recommended for securing webhooks)
// If you set up webhooks in Razorpay dashboard to listen for payment events, 
// you should also set up a webhook secret there and use it here to verify incoming webhook requests.
// define('RAZORPAY_WEBHOOK_SECRET', 'YOUR_RAZORPAY_WEBHOOK_SECRET');


// Example of how you might load keys from a more secure, non-web-accessible file:
/*
$secure_config_path = dirname(__DIR__, 2) . '/razorpay_secure_keys.php'; // Path example: /home/user/razorpay_secure_keys.php

if (file_exists($secure_config_path)) {
    require_once $secure_config_path; // This file would contain the define() statements for keys
} else {
    // Fallback or error if keys are not found.
    // For development, you might allow the defines above to be used.
    // For production, you should ensure the secure file exists or throw an error
    // if the application relies on these constants being defined.
    if (!defined('RAZORPAY_KEY_ID') || !defined('RAZORPAY_KEY_SECRET')) {
        // Log this error securely, don't echo sensitive paths.
        error_log("CRITICAL: Razorpay keys are not defined. Secure config file not found at: " . $secure_config_path);
        // Potentially send a generic 500 error to the client for payment-related endpoints if keys are missing.
        // For non-payment endpoints, this might not be critical immediately.
        // If this config is included in payment processing scripts, a failure here should halt payment processing.
    }
}
*/
?>

    