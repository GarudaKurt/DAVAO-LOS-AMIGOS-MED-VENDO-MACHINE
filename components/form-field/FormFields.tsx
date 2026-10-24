
import { LucideIcon } from "lucide-react";
import { InputHTMLAttributes, ReactNode } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  trailing?: ReactNode;
}

export default function FormField({ label, icon: Icon, trailing, ...props }: FormFieldProps) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-sm font-medium text-neutral-800">
        {label}
      </label>
      <div className="auth-field flex items-center gap-3 rounded-xl border bg-neutral-50 px-4 py-3.5">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-neutral-400" strokeWidth={2} />}
        <input
          {...props}
          className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
        />
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
    </div>
  );
}
