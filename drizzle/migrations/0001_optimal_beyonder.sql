CREATE TABLE `alert_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceKey` varchar(64),
	`symbol` varchar(24),
	`eventType` enum('SOURCE_STATUS','VERIFIED_CATALYST','DATA_WAITING') NOT NULL,
	`title` varchar(220) NOT NULL,
	`detail` text,
	`sourceUrl` text,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alert_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceStatusChanges` boolean NOT NULL DEFAULT false,
	`verifiedCatalysts` boolean NOT NULL DEFAULT false,
	`inAppEnabled` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `alert_preferences_user_uq` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `watchlist_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`symbol` varchar(24) NOT NULL,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `watchlist_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `watchlist_entries_user_symbol_uq` UNIQUE(`userId`,`symbol`)
);
--> statement-breakpoint
CREATE INDEX `alert_events_user_created_idx` ON `alert_events` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `watchlist_entries_user_idx` ON `watchlist_entries` (`userId`);