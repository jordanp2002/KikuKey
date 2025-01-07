import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <div className="flex items-center gap-4">
      Hey, {user.user_metadata.display_name || user.email}!
      <form action={signOutAction}>
        <Button type="submit" className="bg-[#F87171] text-white hover:bg-[#EF4444] rounded-full">
          Sign out
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild variant="ghost" className="hover:bg-[#F87171] hover:text-white transition-colors rounded-full">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild className="bg-[#F87171] text-white hover:bg-[#EF4444] rounded-full">
        <Link href="/sign-up">Get Started</Link>
      </Button>
    </div>
  );
}
