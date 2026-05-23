import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar user={user} />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-nav-safe sm:pb-6">
        {children}
      </main>
    </div>
  );
}
