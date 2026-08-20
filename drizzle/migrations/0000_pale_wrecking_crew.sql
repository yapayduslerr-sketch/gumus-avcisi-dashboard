CREATE TABLE `market_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`symbol` varchar(24) NOT NULL,
	`price` decimal(18,6),
	`changePercent` decimal(10,4),
	`sourceKey` varchar(64) NOT NULL,
	`sourceUrl` text NOT NULL,
	`observedAt` timestamp,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`status` enum('DELAYED','OK','STALE','ERROR') NOT NULL,
	`errorMessage` text,
	CONSTRAINT `market_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `source_statuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceKey` varchar(64) NOT NULL,
	`label` varchar(160) NOT NULL,
	`status` enum('DELAYED','PENDING_API','OK','STALE','ERROR') NOT NULL,
	`sourceUrl` text NOT NULL,
	`lastAttemptAt` timestamp,
	`lastSuccessAt` timestamp,
	`observedAt` timestamp,
	`errorMessage` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `source_statuses_id` PRIMARY KEY(`id`),
	CONSTRAINT `source_statuses_sourceKey_unique` UNIQUE(`sourceKey`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `market_snapshots_symbol_time_idx` ON `market_snapshots` (`symbol`,`fetchedAt`);--> statement-breakpoint
CREATE INDEX `source_statuses_status_idx` ON `source_statuses` (`status`);