import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, LucideIcon } from "lucide-react";

interface TabItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const TABS: TabItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "History", href: "/history", icon: ClipboardList },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-around border-t bg-white py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {TABS.map(({ label, href, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] ${
              active ? "font-semibold text-[var(--color-primary-strong)]" : "text-neutral-400"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
