CREATE TABLE `mutual_fund_health_check` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data` text,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
