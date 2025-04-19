CREATE TABLE "soundPreferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"alarm_id" text NOT NULL,
	"ambient_id" text NOT NULL,
	"bg_music_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sounds" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"url" text NOT NULL,
	"is_custom" boolean DEFAULT true NOT NULL,
	"sound_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "soundPreferences" ADD CONSTRAINT "soundPreferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sounds" ADD CONSTRAINT "sounds_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;