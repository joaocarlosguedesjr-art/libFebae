"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BreakpointView } from "@/components/responsive/breakpoint-view";
import { PageHeader } from "@/components/responsive/page-header";

type User = { id: string; name: string; email: string; cpf: string | null };
type Copy = {
  id: string;
  code: string;
  book: { title: string; author: string };
};

function LoanFormFields({
  users,
  copies,
  userId,
  copyId,
  setUserId,
  setCopyId,
  submitting,
}: {
  users: User[];
  copies: Copy[];
  userId: string;
  copyId: string;
  setUserId: (v: string) => void;
  setCopyId: (v: string) => void;
  submitting: boolean;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="userId">Leitor *</Label>
        <Select
          id="userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        >
          <option value="">Escolha um leitor...</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} {user.cpf ? `(${user.cpf})` : ""}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="copyId">Exemplar *</Label>
        <Select
          id="copyId"
          value={copyId}
          onChange={(e) => setCopyId(e.target.value)}
          required
        >
          <option value="">Escolha um exemplar...</option>
          {copies.map((copy) => (
            <option key={copy.id} value={copy.id}>
              {copy.code} — {copy.book.title}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="dueDate">Data de devolução (opcional)</Label>
        <Input id="dueDate" name="dueDate" type="date" />
        <p className="text-xs text-slate-500">Padrão: 14 dias a partir de hoje</p>
      </div>
      <Button
        type="submit"
        disabled={submitting || !userId || !copyId}
        className="w-full lg:w-auto"
      >
        {submitting ? "Registrando..." : "Confirmar empréstimo"}
      </Button>
    </>
  );
}

function WizardForm({
  users,
  copies,
  userId,
  copyId,
  step,
  setStep,
  setUserId,
  setCopyId,
  submitting,
  onSubmit,
}: {
  users: User[];
  copies: Copy[];
  userId: string;
  copyId: string;
  step: number;
  setStep: (s: number) => void;
  setUserId: (v: string) => void;
  setCopyId: (v: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{step === 1 ? "Passo 1: Leitor" : "Passo 2: Exemplar"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${step >= s ? "bg-brand-700" : "bg-slate-200"}`}
            />
          ))}
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="userId-wizard">Selecione o leitor *</Label>
                <Select
                  id="userId-wizard"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                >
                  <option value="">Escolha um leitor...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} {user.cpf ? `(${user.cpf})` : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={!userId}
                onClick={() => setStep(2)}
              >
                Continuar
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="copyId-wizard">Selecione o exemplar *</Label>
                <Select
                  id="copyId-wizard"
                  value={copyId}
                  onChange={(e) => setCopyId(e.target.value)}
                  required
                >
                  <option value="">Escolha um exemplar...</option>
                  {copies.map((copy) => (
                    <option key={copy.id} value={copy.id}>
                      {copy.code} — {copy.book.title}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate-wizard">Data de devolução (opcional)</Label>
                <Input id="dueDate-wizard" name="dueDate" type="date" />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button type="submit" disabled={submitting || !copyId} className="flex-1">
                  {submitting ? "Registrando..." : "Confirmar"}
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

export default function NovoEmprestimoPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [copies, setCopies] = useState<Copy[]>([]);
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const [copyId, setCopyId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/users?q=")
      .then((r) => r.json())
      .then((data: (User & { role: string })[]) =>
        setUsers(data.filter((u) => u.role === "READER"))
      );
    fetch("/api/copies?available=true")
      .then((r) => r.json())
      .then(setCopies);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const dueDate = form.get("dueDate") as string;

    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        copyId,
        dueDate: dueDate || undefined,
      }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Erro ao registrar empréstimo");
      return;
    }

    toast.success("Empréstimo registrado!");
    router.push("/emprestimos");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Novo empréstimo" description="Registre a retirada de um exemplar" />

      <BreakpointView
        mobile={
          <WizardForm
            users={users}
            copies={copies}
            userId={userId}
            copyId={copyId}
            step={step}
            setStep={setStep}
            setUserId={setUserId}
            setCopyId={setCopyId}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        }
        tablet={
          <WizardForm
            users={users}
            copies={copies}
            userId={userId}
            copyId={copyId}
            step={step}
            setStep={setStep}
            setUserId={setUserId}
            setCopyId={setCopyId}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        }
        desktop={
          <Card>
            <CardHeader>
              <CardTitle>Dados do empréstimo</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
                <LoanFormFields
                  users={users}
                  copies={copies}
                  userId={userId}
                  copyId={copyId}
                  setUserId={setUserId}
                  setCopyId={setCopyId}
                  submitting={submitting}
                />
              </form>
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
