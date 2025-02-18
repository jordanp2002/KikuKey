import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <div className="flex items-center">
      <div className="flex items-center gap-3 text-sm">
        <div className="relative">
          <Image
            src="/kita.jpg"
            alt="Profile picture"
            width={36}
            height={36}
            className="rounded-full ring-2 ring-[#F87171]/20 transition-all duration-300 hover:ring-[#F87171]/40 object-cover"
          />
        </div>
        <span className="font-medium text-gray-700 dark:text-gray-200">
          {user.user_metadata.display_name || user.email}
        </span>
      </div>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <Button 
        asChild 
        variant="ghost" 
        className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
      >
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button 
        asChild 
        className="bg-[#F87171] text-white hover:bg-[#EF4444] transition-colors duration-200 shadow-sm hover:shadow-md"
      >
        <Link href="/sign-up">Get Started</Link>
      </Button>
    </div>
  );
}
