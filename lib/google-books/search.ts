export interface GoogleBookInfo {
  title: string;
  author: string;
  publisher: string;
  publishedDate: string;
  description: string;
  isbn: string;
  coverUrl: string;
  pageCount: number | null;
  genre: string;
}

export async function searchGoogleBooks(query: string): Promise<GoogleBookInfo[]> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5${apiKey ? `&key=${apiKey}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json();
  if (!data.items) return [];

  return data.items.map((item: GoogleBooksItem) => {
    const info = item.volumeInfo;
    const isbn = info.industryIdentifiers?.find(
      (id: { type: string; identifier: string }) => id.type === "ISBN_13" || id.type === "ISBN_10"
    )?.identifier ?? "";

    return {
      title: info.title ?? "",
      author: info.authors?.join(", ") ?? "",
      publisher: info.publisher ?? "",
      publishedDate: info.publishedDate ?? "",
      description: info.description ?? "",
      isbn,
      coverUrl: info.imageLinks?.thumbnail?.replace("http://", "https://") ?? "",
      pageCount: info.pageCount ?? null,
      genre: info.categories?.[0] ?? "",
    };
  });
}

interface GoogleBooksItem {
  volumeInfo: {
    title?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: { thumbnail?: string };
    pageCount?: number;
    categories?: string[];
  };
}
