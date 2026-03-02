"use client";

import Link from "next/link";
import { ProfileProvider } from "@/lib/profile-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ProfileSetup } from "@/components/ProfileSetup";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/progress", label: "Progress", icon: "📈" },
  { href: "/history", label: "History", icon: "📅" },
  { href: "/program", label: "Program", icon: "📋" },
];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ProfileProvider>
        <ProfileSetup />
        <div className="min-h-screen flex flex-col">
          <header className="bg-card border-b border-border sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/" className="text-lg font-bold text-primary">
                  Workout Tracker
                </Link>
                <ProfileSwitcher />
              </div>
              <div className="flex items-center gap-1">
                <nav className="flex gap-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="px-3 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-background transition-colors"
                    >
                      <span className="hidden sm:inline">{item.label}</span>
                      <span className="sm:hidden">{item.icon}</span>
                    </Link>
                  ))}
                </nav>
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
            {children}
          </main>
        </div>
      </ProfileProvider>
    </ThemeProvider>
  );
}
