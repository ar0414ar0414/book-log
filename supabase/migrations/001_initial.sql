-- Users table (synced from Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Books table
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  isbn TEXT,
  cover_url TEXT,
  publisher TEXT,
  published_date TEXT,
  genre TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'want',
  rating REAL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  memo TEXT,
  page_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  page_number INTEGER,
  chapter TEXT,
  memo TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quote tags junction
CREATE TABLE IF NOT EXISTS quote_tags (
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (quote_id, tag_id)
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT,
  extracted_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "users_own" ON users FOR ALL USING (id = auth.uid());
CREATE POLICY "books_own" ON books FOR ALL USING (user_id = auth.uid());
CREATE POLICY "quotes_own" ON quotes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "tags_own" ON tags FOR ALL USING (user_id = auth.uid());
CREATE POLICY "quote_tags_own" ON quote_tags FOR ALL USING (
  quote_id IN (SELECT id FROM quotes WHERE user_id = auth.uid())
);
CREATE POLICY "photos_own" ON photos FOR ALL USING (user_id = auth.uid());
CREATE POLICY "ai_conversations_own" ON ai_conversations FOR ALL USING (user_id = auth.uid());

-- Storage bucket for photos (run in Supabase dashboard or via CLI)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('book-photos', 'book-photos', true);
-- CREATE POLICY "photos_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'book-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "photos_select" ON storage.objects FOR SELECT USING (bucket_id = 'book-photos');
-- CREATE POLICY "photos_delete" ON storage.objects FOR DELETE USING (bucket_id = 'book-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
