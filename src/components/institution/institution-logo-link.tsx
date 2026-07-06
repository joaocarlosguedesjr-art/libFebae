"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { INSTITUTION_DEFAULTS } from "@/lib/institution";
import { cn } from "@/lib/utils";

type InstitutionLogoLinkProps = {
  /** Destino ao clicar — padrão: tela de consulta do catálogo */
  href?: string;
  logoUrl?: string;
  institutionName?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "max-h-10 md:max-h-11",
  md: "max-h-12 md:max-h-14",
  lg: "max-h-16 md:max-h-20",
};

export function InstitutionLogoLink({
  href = "/catalogo",
  logoUrl,
  institutionName,
  className,
  size = "md",
}: InstitutionLogoLinkProps) {
  const [branding, setBranding] = useState({
    institutionLogoUrl: logoUrl ?? INSTITUTION_DEFAULTS.institutionLogoUrl,
    institutionName: institutionName ?? INSTITUTION_DEFAULTS.institutionName,
  });

  useEffect(() => {
    if (logoUrl && institutionName) return;

    fetch("/api/branding")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setBranding({
          institutionLogoUrl: logoUrl ?? data.institutionLogoUrl,
          institutionName: institutionName ?? data.institutionName,
        });
      })
      .catch(() => {});
  }, [logoUrl, institutionName]);

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex rounded-lg transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        className
      )}
      aria-label={`${branding.institutionName} — voltar para consulta do acervo`}
    >
      <Image
        src={branding.institutionLogoUrl}
        alt={`${branding.institutionName} — logo`}
        width={280}
        height={96}
        priority
        className={cn("h-auto w-auto object-contain", sizeClasses[size])}
      />
    </Link>
  );
}
