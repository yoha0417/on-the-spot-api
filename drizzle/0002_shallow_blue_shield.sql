ALTER TABLE `posts` ADD `likes_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `likes_count`;