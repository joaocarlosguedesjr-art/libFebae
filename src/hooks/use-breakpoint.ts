"use client";

import { useEffect, useState } from "react";
import { type Breakpoint, getBreakpoint } from "@/lib/breakpoints";

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("mobile");

  useEffect(() => {
    const update = () => setBreakpoint(getBreakpoint(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return breakpoint;
}

export function useIsMobile() {
  const bp = useBreakpoint();
  return bp === "mobile";
}

export function useIsDesktop() {
  const bp = useBreakpoint();
  return bp === "desktop";
}
