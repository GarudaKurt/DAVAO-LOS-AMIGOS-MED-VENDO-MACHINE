import { LabelHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("text-sm font-semibold text-[var(--color-ink)]", className)} {...props} />
  ),
);

Label.displayName = "Label";

export { Label };
