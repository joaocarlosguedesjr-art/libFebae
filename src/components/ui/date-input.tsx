"use client";

import { forwardRef } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMinDueDateValue() {
  return toDateInputValue(new Date());
}

export function isDueDateNotBeforeToday(value: string) {
  if (!value) return true;
  const chosen = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return chosen >= today;
}

type DateInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  error?: string;
  hint?: string;
};

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput(
  { className, min, error, hint, id, ...props },
  ref,
) {
  const minDate = min ?? getMinDueDateValue();

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <CalendarDays
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-600"
          aria-hidden
        />
        <input
          ref={ref}
          id={id}
          type="date"
          min={minDate}
          className={cn(
            "date-input flex h-11 w-full rounded-lg border bg-gradient-to-b from-white to-brand-50/40 py-2 pl-10 pr-3 text-base text-slate-900 shadow-sm",
            "border-brand-200 transition-colors",
            "hover:border-brand-300",
            "focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-400 focus-visible:ring-red-200",
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});
