CREATE TABLE "chat" (
    "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (
        sequence name "chat_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START
        WITH
            1 CACHE 1
    ),
    "message" text NOT NULL,
    "created_at" TIMESTAMP
    WITH
        TIME zone NOT NULL,
        "updated_at" TIMESTAMP
    WITH
        TIME zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_enrichment_outputs"
ALTER COLUMN "id"
SET DEFAULT gen_random_uuid ();
--> statement-breakpoint
ALTER TABLE "project_repo_artifacts"
ALTER COLUMN "id"
SET DEFAULT gen_random_uuid ();
--> statement-breakpoint
ALTER TABLE "project_enrichment_outputs"
ADD COLUMN "updated_at" TIMESTAMP
WITH
    TIME zone NOT NULL;
--> statement-breakpoint
ALTER TABLE "project_repo_artifacts"
ADD COLUMN "updated_at" TIMESTAMP
WITH
    TIME zone NOT NULL;
