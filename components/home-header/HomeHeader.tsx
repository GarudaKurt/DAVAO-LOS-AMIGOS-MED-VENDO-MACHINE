
import { Bell, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HomeHeaderProps {
  name: string;
  hasNotification?: boolean;
  onBellClick?: () => void;
  onLogout?: () => void;
  loggingOut?: boolean;
}

export default function HomeHeader({ name, hasNotification, onBellClick, onLogout, loggingOut = false }: HomeHeaderProps) {
  return (
    <div className="flex items-start justify-between px-5 pb-2 pt-6 sm:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary-strong)]">Good to see you</p>
        <p className="mt-1 text-xl font-bold tracking-tight text-[var(--color-ink)]">{name}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBellClick}
          aria-label="Notifications"
          className="relative rounded-xl border bg-white p-2.5 text-neutral-700 shadow-sm transition hover:border-[var(--color-primary-soft)] hover:bg-[var(--color-primary-wash)]"
        >
          <Bell className="h-6 w-6" strokeWidth={1.75} />
          {hasNotification && (
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)] ring-2 ring-white" />
          )}
        </button>
        {onLogout && <Button type="button" variant="outline" onClick={onLogout} disabled={loggingOut} className="min-h-11 gap-2 px-3 sm:px-4" aria-label="Log out"><>{loggingOut ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}</><span className="hidden sm:inline">{loggingOut ? "Logging out..." : "Logout"}</span></Button>}
      </div>
    </div>
  );
}
