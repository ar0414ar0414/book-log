-- 全クエリが user_id / book_id での絞り込みなのに索引が無く seq scan になっていたため追加。
-- Supabase ダッシュボードの SQL Editor でも流せるよう IF NOT EXISTS を付けている。

-- 本棚一覧・ダッシュボード（updated_at 降順）
CREATE INDEX IF NOT EXISTS books_user_id_updated_at_idx
  ON books (user_id, updated_at DESC);

-- 引用一覧（全体）と書籍詳細タブ
CREATE INDEX IF NOT EXISTS quotes_user_id_created_at_idx
  ON quotes (user_id, created_at);
CREATE INDEX IF NOT EXISTS quotes_book_id_created_at_idx
  ON quotes (book_id, created_at);

-- タグ一覧・タグ絞り込み
CREATE INDEX IF NOT EXISTS tags_user_id_created_at_idx
  ON tags (user_id, created_at);
-- quote_tags は (quote_id, tag_id) の複合 PK があるので tag_id 単体を補う
CREATE INDEX IF NOT EXISTS quote_tags_tag_id_idx
  ON quote_tags (tag_id);

-- 写真タブ
CREATE INDEX IF NOT EXISTS photos_book_id_created_at_idx
  ON photos (book_id, created_at);
CREATE INDEX IF NOT EXISTS photos_user_id_idx
  ON photos (user_id);

-- AI チャット履歴
CREATE INDEX IF NOT EXISTS ai_conversations_book_id_created_at_idx
  ON ai_conversations (book_id, created_at);
