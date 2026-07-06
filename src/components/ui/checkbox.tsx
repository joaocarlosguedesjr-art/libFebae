import { cn } from "@/lib/utils";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
};

export function Checkbox({ className, label, id, ...props }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn("flex cursor-pointer items-start gap-3 text-sm text-slate-700", className)}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
        {...props}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
