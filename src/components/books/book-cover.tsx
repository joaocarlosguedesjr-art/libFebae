"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { sanitizeCoverImageUrl } from "@/lib/safe-image-url";
import { cn } from "@/lib/utils";

type BookCoverProps = {
  title: string;
  coverImageUrl?: string | null;
  className?: string;
  sizes?: string;
};

export function BookCover({ title, coverImageUrl, className, sizes }: BookCoverProps) {
  const safeUrl = sanitizeCoverImageUrl(coverImageUrl);
  const [failed, setFailed] = useState(false);

  const showImage = safeUrl && !failed;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-gradient-to-br from-brand-100 to-brand-50",
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL externa validada; evita proxy/SSRF
        <img
          src={safeUrl}
          alt={`Capa de ${title}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          sizes={sizes}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-brand-600/70">
          <BookOpen className="h-8 w-8 shrink-0" aria-hidden />
          <span className="line-clamp-3 text-center text-xs font-medium leading-snug">{title}</span>
        </div>
      )}
    </div>
  );
}
