"use client";

import { createContext, useContext, useEffect, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlertDialogContextValue = { open: boolean; onOpenChange: (open: boolean) => void };
const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

function useAlertDialog() {
  const context = useContext(AlertDialogContext);
  if (!context) throw new Error("AlertDialog components must be used inside AlertDialog");
  return context;
}

export function AlertDialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  return <AlertDialogContext.Provider value={{ open, onOpenChange }}>{children}</AlertDialogContext.Provider>;
}

export function AlertDialogContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { open, onOpenChange } = useAlertDialog();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation"><button type="button" aria-label="Close confirmation" className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" onClick={() => onOpenChange(false)} /><div role="alertdialog" aria-modal="true" className={cn("relative w-full max-w-md rounded-2xl border bg-white p-6 shadow-2xl outline-none", className)} {...props}>{children}</div></div>;
}

export function AlertDialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("space-y-2", className)} {...props} />; }
export function AlertDialogTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) { return <h2 className={cn("text-lg font-bold tracking-tight text-[var(--color-ink)]", className)} {...props} />; }
export function AlertDialogDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) { return <p className={cn("text-sm leading-6 text-[var(--color-muted)]", className)} {...props} />; }
export function AlertDialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) { return <div className={cn("mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)} {...props} />; }

export function AlertDialogCancel({ className, children = "Cancel", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { onOpenChange } = useAlertDialog();
  return <button type="button" className={cn("inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--color-primary-soft)] bg-white px-4 py-3 text-sm font-semibold text-[var(--color-primary-strong)] transition hover:bg-[var(--color-primary-wash)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60", className)} onClick={() => onOpenChange(false)} {...props}>{children}</button>;
}

export function AlertDialogAction({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={cn("primary-button inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60", className)} {...props} />;
}
