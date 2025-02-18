import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { GoogleAuthButton } from "@/components/google-auth-button";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex h-[100vh] w-full items-center justify-center">
      <form className="w-full max-w-[400px] mx-4 space-y-6 rounded-2xl border border-border/50 dark:bg-white/5 bg-white p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link className="text-[#F87171] hover:text-[#EF4444] font-medium" href="/sign-up">
              Sign up
            </Link>
          </p>
        </div>
        <div className="space-y-4">
          <GoogleAuthButton mode="sign-in" />
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t dark:border-white/10 border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="dark:bg-white/5 bg-white px-6 text-muted-foreground z-10">
                Or continue with email
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              name="email" 
              placeholder="you@example.com" 
              required 
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <Link
                className="text-xs text-[#F87171] hover:text-[#EF4444]"
                href="/forgot-password"
              >
                Forgot Password?
              </Link>
            </div>
            <Input
              type="password"
              name="password"
              placeholder="Your password"
              required
              className="rounded-xl"
            />
          </div>
          <SubmitButton 
            pendingText="Signing In..." 
            formAction={signInAction}
            className="w-full bg-[#F87171] text-white hover:bg-[#EF4444] rounded-xl"
          >
            Sign in
          </SubmitButton>
          <FormMessage message={searchParams} />
        </div>
      </form>
    </div>
  );
}