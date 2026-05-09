CREATE TABLE `person_anniversaries` (
	`id` text PRIMARY KEY NOT NULL,
	`person_id` text NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`is_repeat` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON UPDATE no action ON DELETE cascade
);
