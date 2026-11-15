import Link from "next/link";
import { Menu, Search } from "lucide-react";

interface NavigationProps {
  currentPatch?: string;
  className?: string;
}

const NAV_LINKS = [
  { href: "/heroes", label: "Heroes" },
  { href: "/interactions", label: "Interactions" },
  { href: "/matchups", label: "Matchups" },
];

export function Navigation({ currentPatch, className }: NavigationProps) {
  return (
    <nav
      className={[
        "sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-sm px-4 py-2",
        className,
      ].join(" ")}
      aria-label="Main navigation"
    >
      <div className="max-w-[1120px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-display font-semibold text-[24px] tracking-[-0.01em] text-text"
          >
            Counterlock
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] font-medium text-text-secondary hover:text-text transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-1.5 text-text-muted hover:text-text transition-colors" aria-label="Search">
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            className="p-1.5 text-text-muted hover:text-text transition-colors md:hidden"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          {currentPatch && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-border text-[11px] font-mono text-text-secondary">
              {currentPatch}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
}