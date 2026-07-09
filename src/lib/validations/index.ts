import { z } from "zod";
import { isValidCpf, stripCpf } from "@/lib/cpf";
import { isSafeExternalImageUrl } from "@/lib/safe-image-url";

const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v));

const optionalInt = z
  .union([z.string(), z.number()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === "") return undefined;
    const n = typeof val === "number" ? val : parseInt(val, 10);
    return Number.isNaN(n) ? undefined : n;
  });

const optionalCoverImageUrl = z
  .string()
  .max(2048)
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v.trim()))
  .refine((v) => v === undefined || isSafeExternalImageUrl(v), {
    message: "URL de capa inválida. Use HTTPS de um site público (sem localhost).",
  });

const cpfField = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ? stripCpf(v) : ""))
  .refine((v) => v === "" || isValidCpf(v), { message: "CPF inválido" });

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const signupRequestSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  cpf: cpfField,
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  role: z.enum(["ADMIN", "READER"]).default("READER"),
  dataSubjectInformed: z
    .boolean()
    .refine((v) => v === true, {
      message: "Confirme que o titular foi informado sobre o tratamento de dados",
    }),
  consentConfirmed: z
    .boolean()
    .refine((v) => v === true, {
      message: "Confirme o consentimento conforme a Política de Privacidade",
    }),
});

export const signupVerifySchema = z.object({
  verificationId: z.string().min(1),
  code: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().length(6, "Informe o código de 6 dígitos")),
});

export const signupResendSchema = z.object({
  verificationId: z.string().min(1),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const passwordResetCompleteSchema = z.object({
  verificationId: z.string().min(1),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirme a nova senha"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export const selfSignupRequestSchema = signupRequestSchema.omit({ role: true }).extend({
  role: z.literal("READER").optional().default("READER"),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  cpf: cpfField,
});

export const dataSubjectRequestSchema = z.object({
  type: z.enum([
    "ACCESS",
    "CORRECTION",
    "DELETION",
    "PORTABILITY",
    "REVOCATION",
    "INFORMATION",
  ]),
  description: z.string().min(10, "Descreva o pedido com pelo menos 10 caracteres").max(2000),
});

export const lgpdRequestHandleSchema = z.object({
  status: z.enum(["IN_PROGRESS", "COMPLETED", "REJECTED"]),
  response: z.string().min(5, "Informe uma resposta ao titular").max(2000),
});

export const bookSchema = z.object({
  workNumber: optionalInt,
  catalogNumber: optionalString,
  authorGroup: optionalString,
  title: z.string().min(1, "Título é obrigatório"),
  subtitle: optionalString,
  author: z.string().min(1, "Autor é obrigatório"),
  medium: optionalString,
  workType: z
    .enum([
      "CODIFICATION",
      "PSYCHOGRAPHED",
      "DICTATED",
      "COMPILATION",
      "BIOGRAPHY",
      "STUDY",
      "OTHER",
      "",
    ])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  isbn: optionalString,
  publisher: optionalString,
  year: optionalInt,
  edition: optionalString,
  collection: optionalString,
  pages: optionalInt,
  language: optionalString,
  synopsis: optionalString,
  notes: optionalString,
  coverImageUrl: optionalCoverImageUrl,
  categories: z.array(z.string()).optional(),
});

export const copySchema = z.object({
  bookId: z.string().min(1),
  code: z.string().min(1, "Código é obrigatório"),
  legacyNumber: optionalInt,
  shelfOrder: optionalInt,
  status: z.enum(["AVAILABLE", "LOANED", "RESERVED", "MAINTENANCE"]).default("AVAILABLE"),
});

export const loanSchema = z.object({
  copyId: z.string().min(1, "Selecione um exemplar"),
  userId: z.string().min(1, "Selecione um leitor"),
  dueDate: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        const chosen = new Date(`${value}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return chosen >= today;
      },
      { message: "A data de devolução não pode ser anterior a hoje" },
    ),
});

export const loanRequestCreateSchema = z.object({
  bookId: z.string().min(1, "Selecione uma obra"),
  readerNote: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export const loanRequestReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  copyId: z.string().optional(),
  adminNote: z.string().max(500, "Máximo 500 caracteres").optional(),
  dueDate: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        const chosen = new Date(`${value}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return chosen >= today;
      },
      { message: "A data de devolução não pode ser anterior a hoje" },
    ),
});

export const appConfigSchema = z.object({
  loanDaysDefault: z
    .union([z.string(), z.number()])
    .transform((val) => {
      const n = typeof val === "number" ? val : parseInt(val, 10);
      return Number.isNaN(n) ? 14 : n;
    })
    .pipe(z.number().int().min(1, "Mínimo 1 dia").max(90, "Máximo 90 dias")),
  institutionName: z.string().min(2, "Nome da instituição é obrigatório"),
  institutionAddress: optionalString,
  institutionEmail: z.string().email("E-mail institucional inválido"),
  dpoName: optionalString,
  dpoEmail: z.string().email("E-mail do encarregado inválido"),
  privacyPolicyVersion: z
    .string()
    .min(1, "Versão obrigatória")
    .regex(/^\d+(\.\d+)*$/, "Use formato semântico, ex.: 1.0 ou 1.1"),
  termsVersion: z
    .string()
    .min(1, "Versão obrigatória")
    .regex(/^\d+(\.\d+)*$/, "Use formato semântico, ex.: 1.0 ou 1.1"),
  institutionLogoUrl: z
    .string()
    .min(1, "Informe o caminho da logo")
    .regex(/^\//, "Use caminho relativo começando com /, ex.: /feabe-logo.jpeg"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetCompleteInput = z.infer<typeof passwordResetCompleteSchema>;
export type UserInput = z.infer<typeof signupRequestSchema>;
export type SignupVerifyInput = z.infer<typeof signupVerifySchema>;
export type BookInput = z.infer<typeof bookSchema>;
export type CopyInput = z.infer<typeof copySchema>;
export type LoanInput = z.infer<typeof loanSchema>;
export type LoanRequestCreateInput = z.infer<typeof loanRequestCreateSchema>;
export type LoanRequestReviewInput = z.infer<typeof loanRequestReviewSchema>;
export type AppConfigInput = z.infer<typeof appConfigSchema>;
