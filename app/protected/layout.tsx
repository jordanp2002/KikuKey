import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { UserProvider } from "@/lib/contexts/user-context";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const displayName = user.user_metadata?.display_name || user.email || 'Guest';

  return (
    <div className="flex-1 flex flex-col">
      <UserProvider displayName={displayName}>
        {children}
      </UserProvider>
    </div>
  );
} 