import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const Alert = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn("rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700", className)} {...props} />
  ),
);

Alert.displayName = "Alert";

export { Alert };
