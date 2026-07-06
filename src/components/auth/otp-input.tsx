"use client";

import { useRef, useState, useEffect, type KeyboardEvent, type ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function OtpInput({ value, onChange, disabled, className }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function updateDigit(index: number, digit: string) {
    const clean = digit.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean || " ";
    const joined = next.join("").replace(/ /g, "");
    onChange(joined);

    if (clean && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index]?.trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  }

  return (
    <div className={cn("flex justify-center gap-2 sm:gap-3", className)}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          value={digits[i]?.trim() ? digits[i] : ""}
          onChange={(e) => updateDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          className="h-12 w-10 rounded-xl border border-slate-300 text-center text-xl font-semibold text-slate-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 sm:h-14 sm:w-12"
          aria-label={`Dígito ${i + 1} do código`}
        />
      ))}
    </div>
  );
}
