import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const STATUS_LABELS: Record<string, string> = {
  want: "積読",
  reading: "読中",
  done: "読了",
};

export const STATUS_COLORS: Record<string, string> = {
  want: "bg-slate-100 text-slate-600",
  reading: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};

const GENRE_MAP: Record<string, string> = {
  "Fiction": "フィクション",
  "Nonfiction": "ノンフィクション",
  "Non-fiction": "ノンフィクション",
  "Business & Economics": "ビジネス・経済",
  "Business": "ビジネス",
  "Economics": "経済",
  "Self-Help": "自己啓発",
  "Self Help": "自己啓発",
  "Psychology": "心理学",
  "Philosophy": "哲学",
  "Science": "科学",
  "History": "歴史",
  "Biography & Autobiography": "伝記・自伝",
  "Biography": "伝記",
  "Technology & Engineering": "テクノロジー",
  "Computers": "IT・コンピュータ",
  "Mathematics": "数学",
  "Medical": "医学",
  "Health & Fitness": "健康・フィットネス",
  "Cooking": "料理",
  "Art": "アート",
  "Music": "音楽",
  "Sports & Recreation": "スポーツ",
  "Travel": "旅行",
  "Religion": "宗教",
  "Education": "教育",
  "Political Science": "政治学",
  "Social Science": "社会学",
  "Literary Collections": "文学",
  "Literary Criticism": "文学評論",
  "Language Arts & Disciplines": "語学",
  "Poetry": "詩",
  "Drama": "ドラマ",
  "Comics & Graphic Novels": "マンガ",
  "Juvenile Fiction": "児童書",
  "Young Adult Fiction": "ヤングアダルト",
  "Law": "法律",
  "True Crime": "ノンフィクション犯罪",
  "Games & Activities": "ゲーム",
  "Design": "デザイン",
  "Architecture": "建築",
  "Nature": "自然",
  "Humor": "ユーモア",
  "Comics": "マンガ",
};

export function localizeGenre(genre: string | null | undefined): string | null {
  if (!genre) return null;
  return GENRE_MAP[genre.trim()] ?? genre;
}
