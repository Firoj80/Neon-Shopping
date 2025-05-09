--
-- Database: `u455934146_neon`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `subscription_status` enum('free','premium') NOT NULL DEFAULT 'free',
  `subscription_expiry_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

-- --------------------------------------------------------

--
-- Table structure for table `shopping_lists`
--

CREATE TABLE `shopping_lists` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `budget_limit` decimal(10,2) DEFAULT 0.00,
  `default_category` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for table `shopping_lists`
--
ALTER TABLE `shopping_lists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fk_default_category` (`default_category`);

--
-- Constraints for table `shopping_lists`
--
ALTER TABLE `shopping_lists`
  ADD CONSTRAINT `shopping_lists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_default_category` FOREIGN KEY (`default_category`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

-- --------------------------------------------------------

--
-- Table structure for table `shopping_list_items`
--

CREATE TABLE `shopping_list_items` (
  `id` varchar(36) NOT NULL,
  `list_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `category` varchar(36) DEFAULT NULL,
  `checked` tinyint(1) DEFAULT 0,
  `date_added` bigint(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for table `shopping_list_items`
--
ALTER TABLE `shopping_list_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `list_id` (`list_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `fk_item_category` (`category`);

--
-- Constraints for table `shopping_list_items`
--
ALTER TABLE `shopping_list_items`
  ADD CONSTRAINT `shopping_list_items_ibfk_1` FOREIGN KEY (`list_id`) REFERENCES `shopping_lists` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shopping_list_items_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_item_category` FOREIGN KEY (`category`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

-- --------------------------------------------------------

--
-- Table structure for table `premium_plans`
--

CREATE TABLE `premium_plans` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price_monthly` decimal(10,2) DEFAULT NULL,
  `price_yearly` decimal(10,2) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `features` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `display_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for table `premium_plans`
--
ALTER TABLE `premium_plans`
  ADD PRIMARY KEY (`id`);

--
-- Dumping data for table `premium_plans`
--
INSERT INTO `premium_plans` (`id`, `name`, `price_monthly`, `price_yearly`, `description`, `features`, `is_active`, `display_order`) VALUES
('monthly', 'Monthly', 5.99, NULL, 'Access all premium features, billed monthly.', 'no_ads,dashboard_access,purchase_history,export_records,unlimited_lists,unlimited_categories,all_themes', 1, 10),
('three_month', '3 Months', 15.00, NULL, 'Save with a quarterly plan.', 'no_ads,dashboard_access,purchase_history,export_records,unlimited_lists,unlimited_categories,all_themes', 1, 20),
('yearly', 'Yearly', NULL, 48.00, 'Best value! Access all premium features, billed annually.', 'no_ads,dashboard_access,purchase_history,export_records,unlimited_lists,unlimited_categories,all_themes', 1, 30);

-- --------------------------------------------------------

--
-- Table structure for table `user_preferences`
--
CREATE TABLE `user_preferences` (
  `user_id` varchar(36) NOT NULL,
  `currency_code` varchar(3) DEFAULT 'USD',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD PRIMARY KEY (`user_id`);

--
-- Constraints for table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD CONSTRAINT `user_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Initial default categories (if user_id IS NULL means it's a global default)
--
INSERT INTO `categories` (`id`, `user_id`, `name`) VALUES
('uncategorized', NULL, 'Uncategorized'),
(UUID(), NULL, 'Home Appliances'),
(UUID(), NULL, 'Health'),
(UUID(), NULL, 'Grocery'),
(UUID(), NULL, 'Fashion'),
(UUID(), NULL, 'Electronics');

COMMIT;
