import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: "primary-button text-white",
  outline: "border border-[var(--color-primary-soft)] bg-white text-[var(--color-primary-strong)] hover:bg-[var(--color-primary-wash)]",
  ghost: "text-neutral-700 hover:bg-[var(--color-primary-wash)]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";

export { Button };
