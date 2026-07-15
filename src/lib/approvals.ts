import { bookInputToPrismaData } from "@/lib/books";
import { confirmEmailVerification } from "@/lib/email-verification";
import { approveLoanRequest, rejectLoanRequest } from "@/lib/loan-requests";
import { confirmReturnLoan, sendDueSoonLoanReminders } from "@/lib/loans";
import { prisma } from "@/lib/prisma";
import { getAppSettings, updateAppSettings } from "@/lib/settings";
import { isBibliotecario } from "@/lib/roles";
import type { ApprovalType } from "@/generated/prisma";
import { encryptPayload, decryptPayload } from "@/lib/crypto-payload";
import type { AppSettings } from "@/lib/app-settings.types";
import { notifyInBackground, sendAdminApprovalNotificationEmail } from "@/lib/email";

export const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  BOOK_CREATE: "Cadastro de livro",
  BOOK_UPDATE: "Edição de livro",
  BOOK_DELETE: "Exclusão de livro",
  COPY_CREATE: "Novo exemplar",
  LOAN_RETURN: "Confirmação de devolução",
  LOAN_REQUEST_REVIEW: "Análise de solicitação de empréstimo",
  LOAN_REMINDER_SEND: "Envio de lembretes",
  USER_CREATE: "Cadastro de usuário",
  SETTINGS_UPDATE: "Alteração de configurações",
  LGPD_REQUEST_UPDATE: "Tratamento de solicitação LGPD",
};

export async function librarianNeedsApproval(role: string): Promise<boolean> {
  if (!isBibliotecario(role)) return false;
  const config = await prisma.appConfig.findUnique({ where: { id: "default" } });
  return config?.librarianRequiresApproval ?? true;
}

async function notifyAdminsOfPendingApproval(input: {
  summary: string;
  type: ApprovalType;
  requestedByName: string;
}) {
  const [admins, pendingCount] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { email: true },
    }),
    prisma.approvalRequest.count({ where: { status: "PENDING" } }),
  ]);

  const emails = admins.map((admin) => admin.email).filter(Boolean);
  if (emails.length === 0) return;

  notifyInBackground(() =>
    sendAdminApprovalNotificationEmail({
      to: emails,
      summary: input.summary,
      typeLabel: APPROVAL_TYPE_LABELS[input.type],
      requestedByName: input.requestedByName,
      pendingCount,
    }),
  );
}

export async function createApprovalRequest(input: {
  type: ApprovalType;
  payload: unknown;
  summary: string;
  entityId?: string;
  requestedById: string;
}) {
  if (input.type === "USER_CREATE") {
    const payload = input.payload as { verificationId?: string };
    if (payload.verificationId) {
      await prisma.emailVerification.update({
        where: { id: payload.verificationId },
        data: { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      });
    }
  }

  const approval = await prisma.approvalRequest.create({
    data: {
      type: input.type,
      summary: input.summary,
      payload: encryptPayload(JSON.stringify(input.payload)),
      entityId: input.entityId ?? null,
      requestedById: input.requestedById,
    },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
    },
  });

  await notifyAdminsOfPendingApproval({
    summary: input.summary,
    type: input.type,
    requestedByName: approval.requestedBy.name,
  });

  return approval;
}

function parsePayload<T>(encrypted: string): T {
  return JSON.parse(decryptPayload(encrypted)) as T;
}

export async function executeApproval(approvalId: string, adminId: string) {
  const approval = await prisma.approvalRequest.findUnique({
    where: { id: approvalId },
  });

  if (!approval || approval.status !== "PENDING") {
    throw new Error("Solicitação inválida ou já processada");
  }

  const payload = parsePayload<Record<string, unknown>>(approval.payload);

  switch (approval.type) {
    case "BOOK_CREATE": {
      const book = await prisma.book.create({
        data: bookInputToPrismaData(payload as Parameters<typeof bookInputToPrismaData>[0]),
        include: { copies: true, categories: true },
      });
      return { type: approval.type, result: book };
    }
    case "BOOK_UPDATE": {
      const { bookId, data } = payload as { bookId: string; data: Parameters<typeof bookInputToPrismaData>[0] };
      const prismaData = bookInputToPrismaData(data);
      const { categories, ...bookData } = prismaData;
      const book = await prisma.book.update({
        where: { id: bookId },
        data: {
          ...bookData,
          categories: categories
            ? { set: [], connectOrCreate: categories.connectOrCreate }
            : undefined,
        },
        include: { copies: true, categories: true },
      });
      return { type: approval.type, result: book };
    }
    case "BOOK_DELETE": {
      const { bookId } = payload as { bookId: string };
      await prisma.book.delete({ where: { id: bookId } });
      return { type: approval.type, result: { success: true, bookId } };
    }
    case "COPY_CREATE": {
      const copy = await prisma.copy.create({
        data: payload as { bookId: string; code: string; legacyNumber?: number | null; shelfOrder?: number | null },
        include: { book: true },
      });
      return { type: approval.type, result: copy };
    }
    case "LOAN_RETURN": {
      const { loanId } = payload as { loanId: string };
      const loan = await confirmReturnLoan(loanId);
      return { type: approval.type, result: loan };
    }
    case "LOAN_REQUEST_REVIEW": {
      const { requestId, action, copyId, adminNote, dueDate } = payload as {
        requestId: string;
        action: "approve" | "reject";
        copyId?: string;
        adminNote?: string;
        dueDate?: string;
      };
      if (action === "approve") {
        if (!copyId) throw new Error("Exemplar não informado");
        const result = await approveLoanRequest(
          requestId,
          adminId,
          copyId,
          dueDate ? new Date(dueDate) : undefined,
        );
        return { type: approval.type, result };
      }
      const result = await rejectLoanRequest(requestId, adminId, adminNote);
      return { type: approval.type, result };
    }
    case "LOAN_REMINDER_SEND": {
      const result = await sendDueSoonLoanReminders();
      return { type: approval.type, result };
    }
    case "USER_CREATE": {
      const { verificationId, code } = payload as { verificationId: string; code: string };
      const user = await confirmEmailVerification(verificationId, code);
      return { type: approval.type, result: user };
    }
    case "SETTINGS_UPDATE": {
      const data = payload as AppSettings;
      const settings = await updateAppSettings({
        ...data,
        institutionAddress: data.institutionAddress ?? null,
        dpoName: data.dpoName ?? null,
      });
      return { type: approval.type, result: settings };
    }
    case "LGPD_REQUEST_UPDATE": {
      const { requestId, status, response } = payload as {
        requestId: string;
        status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
        response?: string;
      };
      const updated = await prisma.dataSubjectRequest.update({
        where: { id: requestId },
        data: {
          status,
          response: response ?? null,
          handledById: adminId,
        },
        include: { user: { select: { name: true, email: true } } },
      });
      return { type: approval.type, result: updated };
    }
    default:
      throw new Error("Tipo de aprovação não suportado");
  }
}

export async function rejectApproval(approvalId: string, adminId: string, adminNote?: string) {
  const approval = await prisma.approvalRequest.findUnique({
    where: { id: approvalId },
  });

  if (!approval || approval.status !== "PENDING") {
    throw new Error("Solicitação inválida ou já processada");
  }

  return prisma.approvalRequest.update({
    where: { id: approvalId },
    data: {
      status: "REJECTED",
      reviewedById: adminId,
      reviewedAt: new Date(),
      adminNote: adminNote ?? null,
    },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function approveAndExecute(approvalId: string, adminId: string, adminNote?: string) {
  await executeApproval(approvalId, adminId);

  return prisma.approvalRequest.update({
    where: { id: approvalId },
    data: {
      status: "APPROVED",
      reviewedById: adminId,
      reviewedAt: new Date(),
      adminNote: adminNote ?? null,
    },
    include: {
      requestedBy: { select: { id: true, name: true, email: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function getApprovalDetail(id: string) {
  const approval = await prisma.approvalRequest.findUnique({
    where: { id },
    include: {
      requestedBy: { select: { id: true, name: true, email: true, role: true } },
      reviewedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!approval) return null;

  let payload: unknown;
  try {
    payload = parsePayload(approval.payload);
  } catch {
    payload = null;
  }

  let entityPreview: unknown = null;
  if (approval.entityId) {
    entityPreview = await loadEntityPreview(approval.type, approval.entityId);
  }

  return {
    ...approval,
    typeLabel: APPROVAL_TYPE_LABELS[approval.type],
    payload,
    entityPreview,
  };
}

async function loadEntityPreview(type: ApprovalType, entityId: string) {
  switch (type) {
    case "BOOK_UPDATE":
    case "BOOK_DELETE":
      return prisma.book.findUnique({
        where: { id: entityId },
        include: { categories: true, copies: true },
      });
    case "LOAN_RETURN":
      return prisma.loan.findUnique({
        where: { id: entityId },
        include: { copy: { include: { book: true } }, user: { select: { name: true, email: true } } },
      });
    case "LOAN_REQUEST_REVIEW":
      return prisma.loanRequest.findUnique({
        where: { id: entityId },
        include: { book: true, user: { select: { name: true, email: true } } },
      });
    case "LGPD_REQUEST_UPDATE":
      return prisma.dataSubjectRequest.findUnique({
        where: { id: entityId },
        include: { user: { select: { name: true, email: true } } },
      });
    default:
      return null;
  }
}

export async function getLibrarianApprovalSetting(): Promise<boolean> {
  const settings = await getAppSettings();
  return settings.librarianRequiresApproval;
}
