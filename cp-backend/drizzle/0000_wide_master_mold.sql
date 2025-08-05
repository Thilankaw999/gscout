CREATE TABLE `chatbot_intents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`intent` varchar(255) NOT NULL,
	`parameters` json,
	`response` text,
	`session_id` varchar(255),
	`confidence` varchar(50),
	`processed` timestamp DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` varchar(255) DEFAULT 'system',
	`updated_by` varchar(255) DEFAULT 'system',
	`deleted_at` timestamp,
	`deleted_by` varchar(255),
	CONSTRAINT `chatbot_intents_id` PRIMARY KEY(`id`)
);

CREATE TABLE `claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`property_id` int NOT NULL,
	`number` varchar(100) NOT NULL,
	`damage_type` varchar(255) NOT NULL,
	`date_of_loss` date NOT NULL,
	`progress` varchar(100) NOT NULL,
	`address` text NOT NULL,
	`estimated_damage` decimal(15,2),
	`last_updated` timestamp NOT NULL,
	`description` text,
	`adjuster_name` varchar(255),
	`estimated_resolution_date` date,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` varchar(255) DEFAULT 'system',
	`updated_by` varchar(255) DEFAULT 'system',
	`deleted_at` timestamp,
	`deleted_by` varchar(255),
	CONSTRAINT `claims_id` PRIMARY KEY(`id`)
);

CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(100) NOT NULL,
	`file_path` text NOT NULL,
	`file_size` bigint,
	`content_type` varchar(100),
	`upload_date` timestamp NOT NULL,
	`s3_bucket` varchar(255),
	`s3_key` varchar(500),
	`download_url` text,
	`url_expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` varchar(255) DEFAULT 'system',
	`updated_by` varchar(255) DEFAULT 'system',
	`deleted_at` timestamp,
	`deleted_by` varchar(255),
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);

CREATE TABLE `user` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(100) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`user_name` varchar(100),
	`mobile_number` varchar(20),
	`tnc_accepted_date` datetime,
	`is_active` tinyint NOT NULL DEFAULT 1,
	`is_staff` tinyint NOT NULL DEFAULT 0,
	`cognito_key` varchar(36),
	`is_verified` tinyint NOT NULL,
	`last_logged_in` timestamp,
	`preferred_name` varchar(100),
	`pronoun` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` varchar(255) DEFAULT 'system',
	`updated_by` varchar(255) DEFAULT 'system',
	`deleted_at` timestamp,
	`deleted_by` varchar(255),
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `uk_user_email` UNIQUE(`email`),
	CONSTRAINT `uk_user_cognito_key` UNIQUE(`cognito_key`)
);

CREATE TABLE `invoice` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoice_number` varchar(50) NOT NULL,
	`invoice_key` varchar(36),
	`member_id` int,
	`provider_account_id` int,
	`provider_id` int,
	`state` varchar(50),
	`invoice_total` decimal(20,2),
	`funded_total` decimal(20,2),
	`paid_total` decimal(20,2),
	`invoice_date` date,
	`received_date` timestamp,
	`source` varchar(50) DEFAULT 'system',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` varchar(255) DEFAULT 'system',
	`updated_by` varchar(255) DEFAULT 'system',
	`deleted_at` timestamp,
	`deleted_by` varchar(255),
	CONSTRAINT `invoice_id` PRIMARY KEY(`id`)
);

CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(50) NOT NULL,
	`address` text NOT NULL,
	`policy_number` varchar(100),
	`effective_date` date,
	`expiration_date` date,
	`coverage_amount` decimal(15,2),
	`deductible` decimal(15,2),
	`status` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`created_by` varchar(255) DEFAULT 'system',
	`updated_by` varchar(255) DEFAULT 'system',
	`deleted_at` timestamp,
	`deleted_by` varchar(255),
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);

ALTER TABLE `chatbot_intents` ADD CONSTRAINT `chatbot_intents_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `claims` ADD CONSTRAINT `claims_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `claims` ADD CONSTRAINT `claims_property_id_properties_id_fk` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `documents` ADD CONSTRAINT `documents_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `properties` ADD CONSTRAINT `properties_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;
CREATE INDEX `idx_chatbot_intents_user_id` ON `chatbot_intents` (`user_id`);
CREATE INDEX `idx_chatbot_intents_intent` ON `chatbot_intents` (`intent`);
CREATE INDEX `idx_chatbot_intents_session_id` ON `chatbot_intents` (`session_id`);
CREATE INDEX `idx_chatbot_intents_processed` ON `chatbot_intents` (`processed`);
CREATE INDEX `idx_chatbot_intents_deleted_at` ON `chatbot_intents` (`deleted_at`);
CREATE INDEX `idx_claims_user_id` ON `claims` (`user_id`);
CREATE INDEX `idx_claims_property_id` ON `claims` (`property_id`);
CREATE INDEX `idx_claims_number` ON `claims` (`number`);
CREATE INDEX `idx_claims_damage_type` ON `claims` (`damage_type`);
CREATE INDEX `idx_claims_progress` ON `claims` (`progress`);
CREATE INDEX `idx_claims_date_of_loss` ON `claims` (`date_of_loss`);
CREATE INDEX `idx_claims_last_updated` ON `claims` (`last_updated`);
CREATE INDEX `idx_claims_deleted_at` ON `claims` (`deleted_at`);
CREATE INDEX `idx_documents_user_id` ON `documents` (`user_id`);
CREATE INDEX `idx_documents_type` ON `documents` (`type`);
CREATE INDEX `idx_documents_upload_date` ON `documents` (`upload_date`);
CREATE INDEX `idx_documents_s3_bucket` ON `documents` (`s3_bucket`);
CREATE INDEX `idx_documents_s3_key` ON `documents` (`s3_key`);
CREATE INDEX `idx_documents_deleted_at` ON `documents` (`deleted_at`);
CREATE INDEX `user_cognito_key_index` ON `user` (`cognito_key`);
CREATE INDEX `idx_user_email` ON `user` (`email`);
CREATE INDEX `idx_user_user_name` ON `user` (`user_name`);
CREATE INDEX `idx_user_mobile_number` ON `user` (`mobile_number`);
CREATE INDEX `idx_user_is_active` ON `user` (`is_active`);
CREATE INDEX `idx_user_is_staff` ON `user` (`is_staff`);
CREATE INDEX `idx_user_is_verified` ON `user` (`is_verified`);
CREATE INDEX `idx_user_deleted_at` ON `user` (`deleted_at`);
CREATE INDEX `idx_invoice_invoice_number` ON `invoice` (`invoice_number`);
CREATE INDEX `idx_invoice_member_id` ON `invoice` (`member_id`);
CREATE INDEX `idx_invoice_provider_id` ON `invoice` (`provider_id`);
CREATE INDEX `idx_invoice_provider_account_id` ON `invoice` (`provider_account_id`);
CREATE INDEX `idx_invoice_state` ON `invoice` (`state`);
CREATE INDEX `idx_invoice_invoice_date` ON `invoice` (`invoice_date`);
CREATE INDEX `idx_invoice_received_date` ON `invoice` (`received_date`);
CREATE INDEX `idx_invoice_deleted_at` ON `invoice` (`deleted_at`);
CREATE INDEX `idx_properties_user_id` ON `properties` (`user_id`);
CREATE INDEX `idx_properties_policy_number` ON `properties` (`policy_number`);
CREATE INDEX `idx_properties_type` ON `properties` (`type`);
CREATE INDEX `idx_properties_status` ON `properties` (`status`);
CREATE INDEX `idx_properties_effective_date` ON `properties` (`effective_date`);
CREATE INDEX `idx_properties_expiration_date` ON `properties` (`expiration_date`);
CREATE INDEX `idx_properties_deleted_at` ON `properties` (`deleted_at`);