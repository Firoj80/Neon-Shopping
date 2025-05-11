<?php
// public_html/api/razorpay_config.php

// ** IMPORTANT: Replace these with your ACTUAL Razorpay Test or Live Keys **
// It's highly recommended to use environment variables or a more secure
// configuration management method in a production environment.
// For shared hosting, defines are common but ensure this file is NOT web-accessible if possible,
// or place it outside the web root and include it.

// For testing, use your Razorpay Test Keys.
// For production, use your Razorpay Live Keys.

define('RAZORPAY_KEY_ID', 'YOUR_RAZORPAY_KEY_ID');         // Replace with your Key ID
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
$secure_config_path = __DIR__ . '/../../razorpay_secure_keys.php'; // Path outside web root

if (file_exists($secure_config_path)) {
    require_once $secure_config_path; // This file would contain the define() statements
} else {
    // Fallback or error if keys are not found.
    // For development, you might allow the defines above to be used.
    // For production, you should ensure the secure file exists or throw an error.
    if (!defined('RAZORPAY_KEY_ID') || !defined('RAZORPAY_KEY_SECRET')) {
        // Log this error securely, don't echo sensitive paths.
        error_log("CRITICAL: Razorpay keys are not defined.");
        // Potentially send a generic 500 error to the client for payment-related endpoints if keys are missing.
        // For non-payment endpoints, this might not be critical immediately.
    }
}
*/
?>
