import { pgTable, text, integer, timestamp, boolean, real, uuid, primaryKey, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const books = pgTable("books", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  author: text("author"),
  isbn: text("isbn"),
  coverUrl: text("cover_url"),
  publisher: text("publisher"),
  publishedDate: text("published_date"),
  genre: text("genre"),
  description: text("description"),
  status: text("status").notNull().default("want"), // want / reading / done
  rating: real("rating"),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  memo: text("memo"),
  preMemo: text("pre_memo"),
  postMemo: text("post_memo"),
  aiRecord: text("ai_record"),
  aiSummary: text("ai_summary"),
  currentPage: integer("current_page"),
  pageCount: integer("page_count"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("books_user_id_updated_at_idx").on(t.userId, t.updatedAt.desc()),
]);

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  pageNumber: integer("page_number"),
  chapter: text("chapter"),
  memo: text("memo"),
  isFavorite: boolean("is_favorite").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("quotes_user_id_created_at_idx").on(t.userId, t.createdAt),
  index("quotes_book_id_created_at_idx").on(t.bookId, t.createdAt),
]);

export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("#6366f1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("tags_user_id_created_at_idx").on(t.userId, t.createdAt),
]);

export const quoteTags = pgTable("quote_tags", {
  quoteId: uuid("quote_id").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
}, (t) => [
  primaryKey({ columns: [t.quoteId, t.tagId] }),
  index("quote_tags_tag_id_idx").on(t.tagId),
]);

export const photos = pgTable("photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  storagePath: text("storage_path").notNull(),
  caption: text("caption"),
  extractedText: text("extracted_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("photos_book_id_created_at_idx").on(t.bookId, t.createdAt),
  index("photos_user_id_idx").on(t.userId),
]);

export const aiConversations = pgTable("ai_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookId: uuid("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user / assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("ai_conversations_book_id_created_at_idx").on(t.bookId, t.createdAt),
]);

/**
 * 一覧・統計で使う軽量な列セット。
 * description / memo / preMemo / postMemo / aiRecord / aiSummary といった
 * 長文カラムを含めないことで、一覧表示のたびに巨大テキストを転送するのを防ぐ。
 */
export const bookListColumns = {
  id: books.id,
  title: books.title,
  author: books.author,
  coverUrl: books.coverUrl,
  genre: books.genre,
  status: books.status,
  rating: books.rating,
  startedAt: books.startedAt,
  finishedAt: books.finishedAt,
  currentPage: books.currentPage,
  pageCount: books.pageCount,
  createdAt: books.createdAt,
  updatedAt: books.updatedAt,
} as const;
