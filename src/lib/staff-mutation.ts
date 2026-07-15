import { toast } from "sonner";

type PendingApprovalBody = {
  pendingApproval?: boolean;
  message?: string;
};

export type StaffMutationResult<T = unknown> = {
  ok: boolean;
  pending: boolean;
  data?: T;
};

/** Trata resposta 202 (fila de aprovação) de mutações do bibliotecário. */
export async function handleStaffMutationResponse<T = unknown>(
  res: Response,
  successMessage: string,
): Promise<StaffMutationResult<T>> {
  const data = (await res.json().catch(() => ({}))) as T & PendingApprovalBody;

  if (res.status === 202 || data.pendingApproval) {
    toast.success(data.message ?? "Solicitação enviada para aprovação do administrador.");
    return { ok: true, pending: true, data };
  }

  if (!res.ok) {
    const err = data as { error?: string };
    toast.error(err.error ?? "Não foi possível concluir a operação");
    return { ok: false, pending: false };
  }

  toast.success(successMessage);
  return { ok: true, pending: false, data };
}
