CREATE TABLE "credit_grants" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_grants" ADD CONSTRAINT "credit_grants_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "credit_grants_project_idx" ON "credit_grants" USING btree ("project_id");