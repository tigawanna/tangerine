CREATE TABLE "project_enrichment_outputs" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"type" text,
	"description" text,
	"summary" text,
	"url" text,
	"source_generation" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"model_id" text,
	"embedding" vector(768),
	"embedded_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_repo_artifacts" (
	"id" text PRIMARY KEY NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"summary" text,
	"generation" integer DEFAULT 1 NOT NULL,
	"collector_version" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "project_enrichment_outputs_owner_name_uidx" ON "project_enrichment_outputs" USING btree ("owner","name");--> statement-breakpoint
CREATE UNIQUE INDEX "project_repo_artifacts_owner_name_uidx" ON "project_repo_artifacts" USING btree ("owner","name");