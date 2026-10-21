CREATE TABLE "task_block_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"block_id" uuid NOT NULL,
	"task_id" integer NOT NULL,
	"planned" boolean DEFAULT false NOT NULL,
	"worked" boolean DEFAULT false NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"worked_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_block_links_block_task" UNIQUE("block_id","task_id")
);
--> statement-breakpoint
ALTER TABLE "task_block_links" ADD CONSTRAINT "task_block_links_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_block_links" ADD CONSTRAINT "task_block_links_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_block_links_user_block" ON "task_block_links" USING btree ("user_id","block_id");
