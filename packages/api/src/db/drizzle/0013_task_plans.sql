CREATE TABLE "task_plans" (
	"user_id" text PRIMARY KEY NOT NULL,
	"session_id" uuid NOT NULL,
	"blocks" jsonb NOT NULL,
	"went_live" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task_plans" ADD CONSTRAINT "task_plans_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;