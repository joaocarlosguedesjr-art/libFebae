export const BREAKPOINTS = {
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = "mobile" | "tablet" | "desktop";

export function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.lg) return "desktop";
  if (width >= BREAKPOINTS.md) return "tablet";
  return "mobile";
}
