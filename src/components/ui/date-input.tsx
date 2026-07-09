"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"] as const;

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

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
  return !isBeforeToday(parseDateInputValue(value));
}

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isBeforeToday(date: Date) {
  return startOfDay(date) < startOfDay(new Date());
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parseDateInputValue(value));
}

function buildCalendarDays(viewYear: number, viewMonth: number) {
  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: Array<{ date: Date; inMonth: boolean }> = [];

  for (let i = startWeekday - 1; i >= 0; i -= 1) {
    cells.push({
      date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i),
      inMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(viewYear, viewMonth, day), inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - (startWeekday + daysInMonth) + 1;
    cells.push({
      date: new Date(viewYear, viewMonth + 1, nextDay),
      inMonth: false,
    });
  }

  return cells;
}

type DateInputProps = {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
  className?: string;
};

export function DateInput({
  id,
  value = "",
  onChange,
  disabled,
  error,
  hint,
  placeholder = "Selecione uma data",
  className,
}: DateInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = value ? parseDateInputValue(value) : null;
  const today = new Date();

  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (selected) {
      setViewYear(selected.getFullYear());
      setViewMonth(selected.getMonth());
    }
  }, [value, selected]);

  function selectDate(date: Date) {
    if (isBeforeToday(date)) return;
    onChange?.(toDateInputValue(date));
    setOpen(false);
  }

  function goToPreviousMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
      return;
    }
    setViewMonth((m) => m - 1);
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
      return;
    }
    setViewMonth((m) => m + 1);
  }

  const cells = buildCalendarDays(viewYear, viewMonth);

  return (
    <div ref={containerRef} className={cn("relative space-y-1.5", className)}>
      <button
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex h-11 w-full items-center gap-3 rounded-lg border bg-gradient-to-b from-white to-brand-50/50 px-3 text-left shadow-sm transition-colors",
          "border-brand-200 hover:border-brand-300",
          "focus-visible:border-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/80",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-400 focus-visible:ring-red-200",
        )}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <span className={cn("flex-1 text-base", value ? "text-slate-900" : "text-slate-400")}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Selecionar data"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full min-w-[18rem] max-w-[20rem] overflow-hidden rounded-xl border border-brand-200 bg-white shadow-xl"
        >
          <div className="border-b border-brand-100 bg-gradient-to-b from-brand-50 to-white px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold capitalize text-brand-900">
                {MONTHS[viewMonth]} de {viewYear}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goToPreviousMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-700 transition hover:bg-brand-100"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={goToNextMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-700 transition hover:bg-brand-100"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                  aria-label="Fechar calendário"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-3">
            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day, index) => (
                <div
                  key={`${day}-${index}`}
                  className="py-1 text-center text-xs font-semibold text-brand-700/80"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map(({ date, inMonth }) => {
                const disabledDay = isBeforeToday(date);
                const isSelected = selected ? isSameDay(date, selected) : false;
                const isToday = isSameDay(date, today);

                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    disabled={disabledDay}
                    onClick={() => selectDate(date)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-sm transition",
                      !inMonth && "text-slate-300",
                      inMonth && !disabledDay && "text-slate-700 hover:bg-brand-100",
                      inMonth && disabledDay && "cursor-not-allowed text-slate-300",
                      isToday && !isSelected && "ring-1 ring-brand-300",
                      isSelected &&
                        "bg-brand-700 font-semibold text-white shadow-sm hover:bg-brand-800",
                    )}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-brand-100 bg-brand-50/40 px-3 py-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-brand-800 hover:bg-brand-100"
              onClick={() => {
                onChange?.("");
                setOpen(false);
              }}
            >
              Limpar
            </Button>
            <Button
              type="button"
              variant="soft"
              size="sm"
              onClick={() => selectDate(today)}
            >
              Hoje
            </Button>
          </div>
        </div>
      )}

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}
