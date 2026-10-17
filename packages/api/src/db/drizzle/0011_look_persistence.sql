CREATE TABLE "themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'My look' NOT NULL,
	"look" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessionSettings" ADD COLUMN "active_theme_id" uuid;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "themes_user_id_idx" ON "themes" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "sessionSettings" ADD CONSTRAINT "sessionSettings_active_theme_id_themes_id_fk" FOREIGN KEY ("active_theme_id") REFERENCES "public"."themes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "session_settings_user_id_unique" ON "sessionSettings" USING btree ("user_id");