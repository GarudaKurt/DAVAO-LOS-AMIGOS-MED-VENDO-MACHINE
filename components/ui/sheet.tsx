"use client";

import { createContext, useContext, useEffect, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SheetContextValue { open: boolean; onOpenChange: (open: boolean) => void; }
const SheetContext = createContext<SheetContextValue | null>(null);
function useSheet() { const context = useContext(SheetContext); if (!context) throw new Error("Sheet components must be used inside Sheet"); return context; }

export function Sheet({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  return <SheetContext.Provider value={{ open, onOpenChange }}>{children}</SheetContext.Provider>;
}

export function SheetContent({ side = "right", className, children }: HTMLAttributes<HTMLDivElement> & { side?: "left" | "right" }) {
  const { open, onOpenChange } = useSheet();
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") onOpenChange(false); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button type="button" aria-label="Close panel" className="absolute inset-0 h-full w-full cursor-default bg-black/20" onClick={() => onOpenChange(false)} />
      <section role="dialog" aria-modal="true" className={cn("absolute inset-y-0 flex w-full max-w-md flex-col bg-white shadow-2xl outline-none sm:w-[min(100%,28rem)]", side === "right" ? "right-0" : "left-0", className)}>
        {children}
      </section>
    </div>
  );
}

export function SheetHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("border-b px-6 pb-5 pt-6", className)} {...props} />; }
export function SheetTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) { return <h2 className={cn("text-xl font-bold tracking-tight text-[var(--color-ink)]", className)} {...props} />; }
export function SheetDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) { return <p className={cn("mt-1 text-sm leading-6 text-[var(--color-muted)]", className)} {...props} />; }
export function SheetFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("mt-auto flex gap-3 border-t bg-white px-6 py-4", className)} {...props} />; }
