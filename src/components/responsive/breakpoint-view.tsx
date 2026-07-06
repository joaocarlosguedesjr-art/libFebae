"use client";

import { useBreakpoint } from "@/hooks/use-breakpoint";

type BreakpointViewProps = {
  mobile: React.ReactNode;
  tablet?: React.ReactNode;
  desktop?: React.ReactNode;
};

export function BreakpointView({ mobile, tablet, desktop }: BreakpointViewProps) {
  const bp = useBreakpoint();

  if (bp === "desktop") return <>{desktop ?? tablet ?? mobile}</>;
  if (bp === "tablet") return <>{tablet ?? mobile}</>;
  return <>{mobile}</>;
}
