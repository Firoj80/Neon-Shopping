-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `subscription_status` ENUM('free', 'premium') NOT NULL DEFAULT 'free',
  `subscription_expiry_date` DATETIME DEFAULT NULL -- Changed to DATETIME for more precision
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Preferences Table (e.g., for currency)
CREATE TABLE IF NOT EXISTS `user_preferences` (
  `user_id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `currency_code` VARCHAR(3) DEFAULT 'USD', -- Default to USD
  -- Add other preferences like theme_id if you plan to store them server-side
  -- `theme_id` VARCHAR(50) DEFAULT 'cyberpunk-cyan',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) DEFAULT NULL, -- NULL for default categories, user_id for custom ones
  `name` VARCHAR(255) NOT NULL,
  CONSTRAINT `uq_category_user_name` UNIQUE (`user_id`, `name`), -- Ensure unique category name per user (or globally if user_id is NULL for defaults)
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL -- If user is deleted, custom categories might become global or be deleted based on your logic
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Shopping Lists Table
CREATE TABLE IF NOT EXISTS `shopping_lists` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `budget_limit` DECIMAL(10, 2) DEFAULT 0.00,
  `default_category` VARCHAR(36) DEFAULT 'uncategorized', -- References id in categories table
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`default_category`) REFERENCES `categories`(`id`) ON DELETE SET DEFAULT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Shopping List Items Table
CREATE TABLE IF NOT EXISTS `shopping_list_items` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `list_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL, -- To ensure items are tied to a user for easier querying/security
  `name` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(10, 2) DEFAULT 0.00,
  `category` VARCHAR(36) NOT NULL DEFAULT 'uncategorized', -- References id in categories table
  `checked` BOOLEAN NOT NULL DEFAULT FALSE,
  `date_added` BIGINT NOT NULL, -- Store as timestamp (milliseconds since epoch)
  FOREIGN KEY (`list_id`) REFERENCES `shopping_lists`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`category`) REFERENCES `categories`(`id`) ON DELETE SET DEFAULT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Premium Plans Table
CREATE TABLE IF NOT EXISTS `premium_plans` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY, -- e.g., 'monthly_basic', 'yearly_premium'
  `name` VARCHAR(255) NOT NULL,
  `price_monthly` DECIMAL(10, 2) DEFAULT NULL,
  `price_yearly` DECIMAL(10, 2) DEFAULT NULL,
  `description` TEXT,
  `features` TEXT, -- Comma-separated list of features
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `display_order` INT DEFAULT 0 -- For ordering plans on the UI
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample Data for Default Categories
INSERT IGNORE INTO `categories` (`id`, `user_id`, `name`) VALUES
('uncategorized', NULL, 'Uncategorized'),
('default-electronics', NULL, 'Electronics'),
('default-grocery', NULL, 'Grocery'),
('default-home', NULL, 'Home Appliances'),
('default-health', NULL, 'Health'),
('default-fashion', NULL, 'Fashion');
-- Add other default categories as needed

-- Sample Data for Premium Plans (Adjust as needed)
INSERT IGNORE INTO `premium_plans` (`id`, `name`, `price_monthly`, `price_yearly`, `description`, `features`, `is_active`, `display_order`) VALUES
('monthly_basic', 'Monthly Basic', 5.99, NULL, 'Basic features, billed monthly.', 'Ad-Free Experience,Dashboard Access,Purchase History,Create Unlimited Lists', TRUE, 10),
('three_month_standard', '3-Month Standard', NULL, 15.00, 'Standard features, billed every 3 months (effectively $5/month).', 'Ad-Free Experience,Dashboard Access,Purchase History,Create Unlimited Lists,Create Unlimited Custom Categories', TRUE, 20),
('yearly_premium', 'Yearly Premium', NULL, 48.00, 'All features, best value, billed annually (effectively $4/month).', 'Ad-Free Experience,Dashboard Access,Purchase History,Analyse and Exports Financial Records,Create Unlimited Lists,Create Unlimited Custom Categories,Unlock All Cyberpunk Themes', TRUE, 30);

-- Note on `ON DELETE` clauses:
-- `ON DELETE CASCADE`: If a user is deleted, their lists, items, and preferences are also deleted.
-- `ON DELETE SET NULL`: If a user is deleted, their custom categories' user_id becomes NULL (making them potentially global defaults, or you might have a cleanup script).
-- `ON DELETE SET DEFAULT`: If a category is deleted, items/lists referencing it will use the default category ID.

-- Ensure the default 'uncategorized' category actually exists if you use ON DELETE SET DEFAULT with 'uncategorized'
-- The INSERT IGNORE above handles this by attempting to insert 'uncategorized' first.
-- If 'uncategorized' might be deleted by a premium user, you'll need a more robust fallback or prevent its deletion.
