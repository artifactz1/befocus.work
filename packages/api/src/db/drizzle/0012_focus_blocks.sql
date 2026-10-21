CREATE TABLE "focus_blocks" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"block_index" integer NOT NULL,
	"planned_seconds" integer NOT NULL,
	"actual_seconds" integer NOT NULL,
	"added_seconds" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"outcome" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "focus_blocks" ADD CONSTRAINT "focus_blocks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "focus_blocks_user_session_idx" ON "focus_blocks" USING btree ("user_id","session_id");