'use client';

import { createClient } from "@/utils/supabase/client";
import { Button } from "./ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface GoogleAuthButtonProps {
  mode: "sign-in" | "sign-up";
  className?: string;
}

export function GoogleAuthButton({ mode, className }: GoogleAuthButtonProps) {
  const router = useRouter();

  const handleGoogleAuth = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          access_type: "offline",
          prompt: "consent",
          auth_mode: mode,
        },
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google auth error:", error);
      // Redirect to sign-in/sign-up page with error message
      const searchParams = new URLSearchParams();
      searchParams.set("message", error.message);
      searchParams.set("error", "true");
      router.push(`/${mode === "sign-in" ? "sign-in" : "sign-up"}?${searchParams.toString()}`);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleAuth}
      className={`w-full flex items-center justify-center gap-2 py-5 ${className}`}
    >
      <Image
        src="/google.svg"
        alt="Google logo"
        width={20}
        height={20}
        className="w-5 h-5"
      />
      <span>Continue with Google</span>
    </Button>
  );
} 