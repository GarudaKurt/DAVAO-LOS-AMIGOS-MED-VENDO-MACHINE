"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption { value: string; label: string; }

interface SelectProps {
  id?: string;
  name?: string;
  value: string;
  options: SelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

export function Select({ id, name, value, options, onValueChange, placeholder = "Select an option", required, disabled, className, ...ariaProps }: SelectProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const moveSelection = (direction: 1 | -1) => {
    const currentIndex = Math.max(options.findIndex((option) => option.value === value), 0);
    const nextIndex = (currentIndex + direction + options.length) % options.length;
    setHighlightedIndex(nextIndex);
    onValueChange(options[nextIndex]?.value ?? "");
  };

  const openMenu = () => {
    setHighlightedIndex(Math.max(options.findIndex((option) => option.value === value), 0));
    setOpen(true);
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <input type="hidden" name={name} value={value} required={required} />
      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${triggerId}-listbox`}
        className={cn("flex h-11 w-full items-center justify-between rounded-lg bg-transparent text-left text-sm text-[var(--color-ink)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60", !selected && "text-neutral-400", className)}
        onClick={() => open ? setOpen(false) : openMenu()}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!open) openMenu();
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) openMenu();
            else moveSelection(event.key === "ArrowDown" ? 1 : -1);
          }
          if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            const nextIndex = event.key === "Home" ? 0 : Math.max(options.length - 1, 0);
            setHighlightedIndex(nextIndex);
            if (open) onValueChange(options[nextIndex]?.value ?? "");
          }
        }}
        {...ariaProps}
      >
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn("h-4 w-4 text-neutral-400 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div id={`${triggerId}-listbox`} role="listbox" aria-labelledby={triggerId} className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full rounded-xl border bg-white p-1.5 shadow-[0_16px_40px_rgba(62,31,46,0.14)]">
          {options.map((option, index) => (
            <button key={option.value} type="button" role="option" aria-selected={option.value === value} className={cn("flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--color-primary-wash)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]", index === highlightedIndex && "bg-[var(--color-primary-wash)]", option.value === value && "font-semibold text-[var(--color-primary-strong)]")} onMouseEnter={() => setHighlightedIndex(index)} onClick={() => { onValueChange(option.value); setHighlightedIndex(index); setOpen(false); }}>
              <span>{option.label}</span>
              {option.value === value && <Check className="h-4 w-4" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
