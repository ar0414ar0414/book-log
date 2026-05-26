ALTER TABLE "quote_tags" ADD CONSTRAINT "quote_tags_quote_id_tag_id_pk" PRIMARY KEY("quote_id","tag_id");--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "ai_record" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "ai_summary" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "current_page" integer;