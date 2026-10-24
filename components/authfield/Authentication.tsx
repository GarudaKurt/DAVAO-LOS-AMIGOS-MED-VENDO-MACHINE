import { LucideIcon } from "lucide-react";
import { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
}

export default function AuthField({ label, icon: Icon, value, onChange, ...props }: AuthFieldProps) {
  return (
    <div className="mb-5">
      <Label htmlFor={props.id ?? props.name} className="mb-2 block">
        {label}
      </Label>
      <div className="auth-field flex items-center gap-3 rounded-xl border bg-neutral-50/80 px-4 py-3.5">
        <Icon className="h-4 w-4 shrink-0 text-[var(--color-muted)]" strokeWidth={2} aria-hidden="true" />
        <Input
          id={props.id ?? props.name}
          value={value}
          onChange={onChange}
          {...props}
        />
      </div>
    </div>
  );
}
