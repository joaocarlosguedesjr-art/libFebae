"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Home,
  LogOut,
  Repeat,
  Settings,
  Shield,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import type { UserRole } from "@/lib/roles";
import { isAdmin, isStaff } from "@/lib/roles";

export const LGPD_GOV_URL =
  "https://www.gov.br/defesa/pt-br/acesso-a-informacao/lei-geral-de-protecao-de-dados-pessoais-lgpd";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
};

const staffNav: NavItem[] = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/acervo", label: "Acervo", icon: BookOpen },
  { href: "/emprestimos", label: "Empréstimos", icon: Repeat },
  { href: "/emprestimos/solicitacoes", label: "Solicitações", icon: ClipboardList },
  { href: "/usuarios", label: "Usuários", icon: Users },
  { href: "/configuracoes", label: "Config.", icon: Settings },
  { href: LGPD_GOV_URL, label: "LGPD", icon: Shield, external: true },
];

const adminOnlyNav: NavItem[] = [
  { href: "/aprovacoes", label: "Aprovações", icon: ClipboardCheck },
];

const readerNav: NavItem[] = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/acervo", label: "Acervo", icon: BookOpen },
  { href: "/emprestimos/solicitar", label: "Solicitar", icon: Repeat },
  { href: "/emprestimos", label: "Meus empréstimos", icon: ClipboardList },
  { href: "/meus-dados", label: "Meus dados", icon: UserCircle },
];

function useNavItems(role: UserRole) {
  if (!isStaff(role)) return readerNav;
  if (isAdmin(role)) {
    return [...staffNav.slice(0, 6), ...adminOnlyNav, ...staffNav.slice(6)];
  }
  return staffNav;
}

function isActive(pathname: string, href: string, external?: boolean) {
  if (external) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const linkClass = {
  mobile: (active: boolean) =>
    cn(
      "flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors",
      active ? "text-brand-700" : "text-slate-500"
    ),
  tablet: (active: boolean) =>
    cn(
      "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      active ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-50"
    ),
  desktop: (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
      active ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-50"
    ),
};

function NavItemLink({
  item,
  variant,
  pathname,
}: {
  item: NavItem;
  variant: "mobile" | "tablet" | "desktop";
  pathname: string;
}) {
  const { href, label, icon: Icon, external } = item;
  const active = isActive(pathname, href, external);
  const className = linkClass[variant](active);

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        title="Lei Geral de Proteção de Dados — gov.br"
      >
        <Icon className={variant === "mobile" ? "h-5 w-5" : variant === "tablet" ? "h-4 w-4" : "h-5 w-5"} />
        {variant === "mobile" ? <span className="truncate">{label}</span> : label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      <Icon className={variant === "mobile" ? "h-5 w-5" : variant === "tablet" ? "h-4 w-4" : "h-5 w-5"} />
      {variant === "mobile" ? <span className="truncate">{label}</span> : label}
    </Link>
  );
}

/** Mobile (<768px): navegação inferior fixa */
export function MobileNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = useNavItems(role);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex items-stretch justify-around">
        {items.map((item) => (
          <NavItemLink key={item.href} item={item} variant="mobile" pathname={pathname} />
        ))}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex min-h-16 flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium text-slate-500"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </div>
    </nav>
  );
}

/** Tablet (768–1023px): barra superior horizontal */
export function TabletNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = useNavItems(role);

  return (
    <nav className="hidden border-b border-slate-200 bg-white md:block lg:hidden">
      <div className="flex items-center gap-1 overflow-x-auto px-4 py-2">
        {items.map((item) => (
          <NavItemLink key={item.href} item={item} variant="tablet" pathname={pathname} />
        ))}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="ml-auto flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </nav>
  );
}

/** Desktop (≥1024px): sidebar lateral */
export function DesktopNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = useNavItems(role);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 p-6">
        <Link href="/dashboard" className="text-xl font-bold text-brand-800">
          Biblioteca
        </Link>
        <p className="mt-1 text-sm text-slate-500">Sistema de gestão</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {items.map((item) => (
          <NavItemLink key={item.href} item={item} variant="desktop" pathname={pathname} />
        ))}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
