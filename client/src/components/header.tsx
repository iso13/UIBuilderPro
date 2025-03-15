import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "wouter";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="flex items-center gap-4">
        <Link href="/">
          <span className="text-sm font-medium transition-colors hover:text-primary cursor-pointer">
            Home
          </span>
        </Link>
        <Link href="/analytics">
          <span className="text-sm font-medium transition-colors hover:text-primary cursor-pointer">
            Analytics
          </span>
        </Link>
      </nav>
      <ThemeToggle />
    </header>
  );
}