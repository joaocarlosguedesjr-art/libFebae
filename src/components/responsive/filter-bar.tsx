import { cn } from "@/lib/utils";

type FilterOption<T extends string> = {
  value: T;
  label: string;
};

type FilterBarProps<T extends string> = {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

export function FilterBar<T extends string>({
  options,
  value,
  onChange,
  className,
}: FilterBarProps<T>) {
  return (
    <>
      {/* Mobile / tablet: chips com scroll horizontal */}
      <div className={cn("flex gap-2 overflow-x-auto pb-1 lg:hidden", className)}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              value === option.value
                ? "bg-brand-700 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Desktop: grupo de botões em linha */}
      <div className={cn("hidden flex-wrap gap-2 lg:flex", className)}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              value === option.value
                ? "bg-brand-700 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}
