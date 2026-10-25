"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileProvider } from "@/lib/profile-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ProfileSetup } from "@/components/ProfileSetup";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { href: "/", label: "Today" },
  { href: "/coach", label: "Coach" },
  { href: "/week", label: "Week" },
  { href: "/meals", label: "Meals" },
  { href: "/progress", label: "Progress" },
  { href: "/history", label: "History" },
  { href: "/program", label: "Program" },
];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <ThemeProvider>
      <ProfileProvider>
        <ProfileSetup />
        <div className="min-h-screen flex flex-col">
          <header className="bg-card border-b border-border sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-4 flex flex-wrap items-stretch gap-x-6">
              <div className="flex items-center gap-3 h-[52px]">
                <Link href="/" className="text-sm font-medium text-heading">
                  Workout
                </Link>
                <ProfileSwitcher />
              </div>
              <nav className="order-last sm:order-none w-full sm:w-auto flex gap-5 overflow-x-auto [scrollbar-width:none] sm:overflow-visible h-10 sm:h-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active(item.href) ? "page" : undefined}
                    className={`flex items-center whitespace-nowrap text-sm border-b-[3px] -mb-px ${
                      active(item.href)
                        ? "border-teal text-heading font-medium"
                        : "border-transparent text-foreground hover:text-heading"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="ml-auto flex items-center h-[52px]">
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
