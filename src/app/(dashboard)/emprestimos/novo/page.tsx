import { Suspense } from "react";
import { PageHeader } from "@/components/responsive/page-header";
import { AdminDirectLoanWizard } from "@/components/loans/admin-direct-loan-wizard";
import { Skeleton } from "@/components/ui/skeleton";

export default function NovoEmprestimoPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader
        title="Emprestar"
        description="Selecione o leitor e a obra no catálogo — sem aprovação de solicitação"
      />
      <Suspense
        fallback={
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <AdminDirectLoanWizard />
      </Suspense>
    </div>
  );
}
