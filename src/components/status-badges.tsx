import { CopyStatus, LoanRequestStatus, LoanStatus } from "@/generated/prisma";
import { Badge } from "@/components/ui/badge";

const copyLabels: Record<CopyStatus, string> = {
  AVAILABLE: "Disponível",
  LOANED: "Emprestado",
  RESERVED: "Reservado",
  MAINTENANCE: "Manutenção",
};

const copyVariants: Record<CopyStatus, "success" | "warning" | "danger" | "secondary" | "default"> = {
  AVAILABLE: "success",
  LOANED: "warning",
  RESERVED: "secondary",
  MAINTENANCE: "danger",
};

const loanLabels: Record<LoanStatus, string> = {
  ACTIVE: "Ativo",
  RETURNED: "Devolvido",
  OVERDUE: "Atrasado",
};

const loanVariants: Record<LoanStatus, "success" | "warning" | "danger" | "secondary" | "default"> = {
  ACTIVE: "secondary",
  RETURNED: "success",
  OVERDUE: "danger",
};

export function CopyStatusBadge({ status }: { status: CopyStatus }) {
  return <Badge variant={copyVariants[status]}>{copyLabels[status]}</Badge>;
}

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  return <Badge variant={loanVariants[status]}>{loanLabels[status]}</Badge>;
}

const requestLabels: Record<LoanRequestStatus, string> = {
  PENDING: "Aguardando",
  APPROVED: "Aprovada",
  REJECTED: "Indeferida",
  CANCELLED: "Cancelada",
};

const requestVariants: Record<
  LoanRequestStatus,
  "success" | "warning" | "danger" | "secondary" | "default"
> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "secondary",
};

export function LoanRequestStatusBadge({ status }: { status: LoanRequestStatus }) {
  return <Badge variant={requestVariants[status]}>{requestLabels[status]}</Badge>;
}
