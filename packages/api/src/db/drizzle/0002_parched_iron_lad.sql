CREATE TABLE "sessionSettings" (
	"id" text PRIMARY KEY NOT NULL,
	"work_duration" integer NOT NULL,
	"break_duration" integer NOT NULL,
	"number_of_sessions" integer NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessionSettings" ADD CONSTRAINT "sessionSettings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;