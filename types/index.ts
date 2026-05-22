export type BookStatus = "want" | "reading" | "done";

export interface Book {
  id: string;
  userId: string;
  title: string;
  author: string | null;
  isbn: string | null;
  coverUrl: string | null;
  publisher: string | null;
  publishedDate: string | null;
  genre: string | null;
  description: string | null;
  status: BookStatus;
  rating: number | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  memo: string | null;
  pageCount: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quote {
  id: string;
  bookId: string;
  userId: string;
  text: string;
  pageNumber: number | null;
  chapter: string | null;
  memo: string | null;
  isFavorite: boolean;
  createdAt: Date;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
}

export interface Photo {
  id: string;
  bookId: string;
  userId: string;
  url: string;
  storagePath: string;
  caption: string | null;
  extractedText: string | null;
  createdAt: Date;
}

export interface AiMessage {
  id: string;
  bookId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}
