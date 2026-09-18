CREATE TABLE `LoginAttempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`windowStart` text NOT NULL
);
