"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBar({
  placeholder = "Buscar por título, autor ou ISBN...",
  onSearch,
  defaultValue = "",
}: {
  placeholder?: string;
  onSearch: (query: string) => void;
  defaultValue?: string;
}) {
  const [query, setQuery] = useState(defaultValue);

  return (
    <form
      className="sticky top-0 z-10 bg-slate-50 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(query);
      }}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Input
          type="search"
          inputMode="search"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
          className="pl-10"
        />
      </div>
    </form>
  );
}
