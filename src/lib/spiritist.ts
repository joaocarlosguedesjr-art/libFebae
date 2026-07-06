import { SpiritWorkType } from "@/generated/prisma";

export const SPIRIT_WORK_TYPES: { value: SpiritWorkType; label: string }[] = [
  { value: "CODIFICATION", label: "Codificação" },
  { value: "PSYCHOGRAPHED", label: "Psicografado" },
  { value: "DICTATED", label: "Ditado" },
  { value: "COMPILATION", label: "Compilação" },
  { value: "BIOGRAPHY", label: "Biografia" },
  { value: "STUDY", label: "Estudo / Doutrina" },
  { value: "OTHER", label: "Outro" },
];

export const SPIRITIST_GENRES = [
  "Codificação Kardecista",
  "Romance Espírita",
  "Doutrina e Estudo",
  "Infantojuvenil",
  "Biografia",
  "Poesia",
  "Humor",
  "Mediunidade",
  "Evangelho no Lar",
  "Passos de Jesus",
  "Histórias de Emmanuel",
  "Série André Luiz",
] as const;

export function formatWorkType(type: SpiritWorkType | null | undefined): string {
  if (!type) return "";
  return SPIRIT_WORK_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function formatBookCredit(author: string, medium?: string | null): string {
  if (medium?.trim()) {
    return `${author} · Médium: ${medium}`;
  }
  return author;
}

export type BookFormData = {
  title: string;
  subtitle?: string;
  author: string;
  medium?: string;
  workType?: SpiritWorkType | "";
  isbn?: string;
  publisher?: string;
  year?: number;
  edition?: string;
  collection?: string;
  pages?: number;
  language?: string;
  synopsis?: string;
  notes?: string;
  categories?: string[];
};
