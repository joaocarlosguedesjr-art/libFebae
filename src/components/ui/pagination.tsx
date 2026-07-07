"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
};

function pageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "ellipsis")[] = [1];
  if (current > 3) pages.push("ellipsis");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);

  if (current < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);

  return (
    <nav
      className={cn("flex flex-col items-center gap-3 sm:flex-row sm:justify-between", className)}
      aria-label="Paginação do catálogo"
    >
      <p className="text-sm text-slate-500">
        {from}–{to} de {totalItems} título(s)
      </p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers(page, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <span key={`e-${index}`} className="px-1 text-slate-400">
              …
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant={item === page ? "default" : "outline"}
              size="sm"
              className="min-w-9"
              onClick={() => onPageChange(item)}
              aria-label={`Página ${item}`}
              aria-current={item === page ? "page" : undefined}
            >
              {item}
            </Button>
          ),
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}
