import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <Link href="/privacidade" className="hover:text-brand-700 hover:underline">
          Política de Privacidade
        </Link>
        <Link href="/termos" className="hover:text-brand-700 hover:underline">
          Termos de Uso
        </Link>
        <Link href="/lgpd" className="hover:text-brand-700 hover:underline">
          Seus direitos (LGPD)
        </Link>
      </nav>
      <p className="mt-3 text-xs text-slate-400">
        Tratamento de dados pessoais conforme a Lei nº 13.709/2018 (LGPD).
      </p>
    </footer>
  );
}
