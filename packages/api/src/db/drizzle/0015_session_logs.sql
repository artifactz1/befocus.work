CREATE TABLE "block_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"block_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"rating" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "block_logs_user_block" UNIQUE("user_id","block_id")
);
--> statement-breakpoint
CREATE TABLE "session_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_id" uuid NOT NULL,
	"next_time" text DEFAULT '' NOT NULL,
	"extra_done" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"carried" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_notes_user_session" UNIQUE("user_id","session_id")
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "later" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "later_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "block_logs" ADD CONSTRAINT "block_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_notes" ADD CONSTRAINT "session_notes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "block_logs_user_session" ON "block_logs" USING btree ("user_id","session_id");--> statement-breakpoint
CREATE INDEX "focus_blocks_user_started_idx" ON "focus_blocks" USING btree ("user_id","started_at");
