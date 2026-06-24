CREATE TABLE `AdminSessions` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`deviceFingerprint` text NOT NULL,
	`userAgent` text NOT NULL,
	`ip` text NOT NULL,
	`createdAt` text NOT NULL,
	`expiresAt` text NOT NULL,
	`lastActivity` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `AdminSessions_token_unique` ON `AdminSessions` (`token`);--> statement-breakpoint
CREATE TABLE `ClientNodes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`clientId` integer NOT NULL,
	`parentId` integer,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`blobKey` text,
	`mimeType` text,
	`size` integer,
	`pageSlug` text,
	`createdAt` text NOT NULL,
	FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ClientSessions` (
	`id` text PRIMARY KEY NOT NULL,
	`clientId` integer NOT NULL,
	`token` text NOT NULL,
	`deviceFingerprint` text NOT NULL,
	`userAgent` text NOT NULL,
	`ip` text NOT NULL,
	`createdAt` text NOT NULL,
	`expiresAt` text NOT NULL,
	`lastActivity` text NOT NULL,
	FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ClientSessions_token_unique` ON `ClientSessions` (`token`);--> statement-breakpoint
CREATE TABLE `Clients` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`passwordHash` text NOT NULL,
	`isActive` integer DEFAULT 1 NOT NULL,
	`createdAt` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Clients_slug_unique` ON `Clients` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `Clients_email_unique` ON `Clients` (`email`);--> statement-breakpoint
CREATE TABLE `FormSubmissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fullName` text NOT NULL,
	`email` text NOT NULL,
	`message` text,
	`resendMessageId` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `Links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`tags` text NOT NULL,
	`date` text NOT NULL
);
