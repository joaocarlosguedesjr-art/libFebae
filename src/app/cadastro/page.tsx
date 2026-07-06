import { CreateUserWizard } from "@/components/auth/create-user-wizard";
import { BookAssistant } from "@/components/chat/book-assistant";
import { InstitutionLogoLink } from "@/components/institution/institution-logo-link";
import { PublicFooter } from "@/components/legal/public-footer";

export const metadata = {
  title: "Criar conta — Biblioteca",
};

export default function CadastroPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 to-[var(--background)]">
      <header className="border-b border-brand-200 bg-brand-header px-4 py-4">
        <div className="mx-auto flex max-w-lg justify-center">
          <InstitutionLogoLink />
        </div>
      </header>
      <main className="flex-1 px-4 py-8">
        <CreateUserWizard mode="public" title="Criar conta de leitor" />
      </main>
      <PublicFooter />
      <BookAssistant />
    </div>
  );
}
