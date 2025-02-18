import HeaderAuth from "@/components/header-auth";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { SettingsMenu } from "@/components/settings-menu";
import { ThemeProvider } from "next-themes";
import { ThemeSwitcher } from "@/components/theme-switcher";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

const geistSans = Geist({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light">
          <main className="flex flex-col flex-1">
            <nav className="w-full flex justify-center border-b-2 border-slate-200 dark:border-slate-700 h-16 flex-shrink-0">
              <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
                <div className="flex gap-5 items-center font-semibold">
                  <Link href="/" className="text-2xl"><span>Kiku</span><span className="text-accent">Key</span></Link>
                  <nav className="hidden md:flex gap-6">
                  </nav>
                </div>
                <div className="flex items-center gap-4">
                  <HeaderAuth />
                  <SettingsMenu />
                </div>
              </div>
            </nav>
            <div className="flex-1 flex flex-col min-h-0">
              {children}
            </div>
            <footer className="w-full flex items-center justify-center border-t-2 border-slate-200 dark:border-slate-700 mx-auto text-center text-xs gap-8 py-4 flex-shrink-0">
              <ThemeSwitcher />
            </footer>
          </main>
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
