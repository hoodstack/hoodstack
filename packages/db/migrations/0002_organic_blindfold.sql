CREATE TYPE "public"."policy_mode" AS ENUM('off', 'enforce');--> statement-breakpoint
CREATE TABLE "policy_allowlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"address" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"max_value_wei" text,
	"allowlist_mode" "policy_mode" DEFAULT 'off' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_policies_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
ALTER TABLE "policy_allowlist" ADD CONSTRAINT "policy_allowlist_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_policies" ADD CONSTRAINT "project_policies_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "policy_allowlist_project_address_idx" ON "policy_allowlist" USING btree ("project_id","address");