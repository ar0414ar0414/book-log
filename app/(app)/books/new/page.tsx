import BookForm from "@/components/books/BookForm";

export default function NewBookPage() {
  return (
    <div className="pb-nav-safe sm:pb-6">
      <h1 className="text-xl font-bold text-slate-900 mb-6">本を登録</h1>
      <BookForm />
    </div>
  );
}
