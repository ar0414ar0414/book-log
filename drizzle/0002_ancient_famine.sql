CREATE INDEX "ai_conversations_book_id_created_at_idx" ON "ai_conversations" USING btree ("book_id","created_at");--> statement-breakpoint
CREATE INDEX "books_user_id_updated_at_idx" ON "books" USING btree ("user_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "photos_book_id_created_at_idx" ON "photos" USING btree ("book_id","created_at");--> statement-breakpoint
CREATE INDEX "photos_user_id_idx" ON "photos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quote_tags_tag_id_idx" ON "quote_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "quotes_user_id_created_at_idx" ON "quotes" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "quotes_book_id_created_at_idx" ON "quotes" USING btree ("book_id","created_at");--> statement-breakpoint
CREATE INDEX "tags_user_id_created_at_idx" ON "tags" USING btree ("user_id","created_at");