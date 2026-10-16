ALTER TABLE "sounds" ADD COLUMN "label_color" text;--> statement-breakpoint
ALTER TABLE "sounds" ADD COLUMN "label_image" text;--> statement-breakpoint
ALTER TABLE "sounds" ADD COLUMN "disc_finish" text DEFAULT 'black' NOT NULL;