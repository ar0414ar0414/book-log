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
