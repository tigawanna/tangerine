CREATE TABLE `enriched_repos` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`type` text,
	`chunk_key` text NOT NULL,
	`model_id` text NOT NULL,
	`source_generation` integer NOT NULL,
	`source_enrichment_at` integer,
	`text` text NOT NULL,
	`embedding` F32_BLOB(768) NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enriched_repos_owner_name_chunk_uidx` ON `enriched_repos` (`owner`,`name`,`chunk_key`);--> statement-breakpoint
CREATE TABLE `project_enrichment_outputs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`source_generation` integer NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_enrichment_outputs_owner_name_uidx` ON `project_enrichment_outputs` (`owner`,`name`);--> statement-breakpoint
CREATE TABLE `project_repo_artifacts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`generation` integer DEFAULT 1 NOT NULL,
	`collector_version` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_repo_artifacts_owner_name_uidx` ON `project_repo_artifacts` (`owner`,`name`);
