"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToastItem = { id: number; title: string; description?: string; variant?: "default" | "error" };
type ToastInput = Omit<ToastItem, "id">;
const ToastContext = createContext<{ toast: (input: ToastInput) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = (input: ToastInput) => {
    const id = Date.now();
    setItems((current) => [...current, { ...input, id }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 3500);
  };
  const value = useMemo(() => ({ toast }), []);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] flex w-[min(calc(100%-2rem),24rem)] flex-col gap-3" aria-live="polite">
        {items.map((item) => <div key={item.id} className={cn("rounded-xl border bg-white p-4 shadow-xl", item.variant === "error" && "border-red-200")}><p className="text-sm font-semibold text-[var(--color-ink)]">{item.title}</p>{item.description && <p className="mt-1 text-sm text-[var(--color-muted)]">{item.description}</p>}</div>)}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() { const context = useContext(ToastContext); if (!context) throw new Error("useToast must be used inside ToastProvider"); return context; }
