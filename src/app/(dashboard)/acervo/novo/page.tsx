"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SPIRITIST_GENRES, SPIRIT_WORK_TYPES } from "@/lib/spiritist";

function emptyToUndefined(value: FormDataEntryValue | null) {
  const str = String(value ?? "").trim();
  return str === "" ? undefined : str;
}

export default function NovoLivroPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [categoriesInput, setCategoriesInput] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const categories = categoriesInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const body = {
      title: form.get("title") as string,
      subtitle: emptyToUndefined(form.get("subtitle")),
      author: form.get("author") as string,
      medium: emptyToUndefined(form.get("medium")),
      workType: emptyToUndefined(form.get("workType")),
      isbn: emptyToUndefined(form.get("isbn")),
      publisher: emptyToUndefined(form.get("publisher")),
      year: emptyToUndefined(form.get("year")),
      edition: emptyToUndefined(form.get("edition")),
      collection: emptyToUndefined(form.get("collection")),
      pages: emptyToUndefined(form.get("pages")),
      language: emptyToUndefined(form.get("language")),
      synopsis: emptyToUndefined(form.get("synopsis")),
      notes: emptyToUndefined(form.get("notes")),
      coverImageUrl: emptyToUndefined(form.get("coverImageUrl")),
      categories,
    };

    const res = await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSubmitting(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Erro ao cadastrar obra");
      return;
    }

    const book = await res.json();
    toast.success("Obra cadastrada!");
    router.push(`/acervo/${book.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Nova obra</h1>
      <p className="text-sm text-slate-500">
        Apenas título e autor são obrigatórios. Os demais campos seguem o padrão de fichas de bibliotecas espíritas.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" name="title" required placeholder="Ex: O Livro dos Espíritos" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input id="subtitle" name="subtitle" placeholder="Ex: Princípios da Doutrina Espírita" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Autor *</Label>
              <Input
                id="author"
                name="author"
                required
                placeholder="Autor espiritual ou codificador (ex: Allan Kardec, André Luiz)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medium">Médium</Label>
              <Input
                id="medium"
                name="medium"
                placeholder="Ex: Francisco Cândido Xavier (quando psicografado)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workType">Tipo de obra</Label>
              <Select id="workType" name="workType" defaultValue="">
                <option value="">Selecione (opcional)</option>
                {SPIRIT_WORK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categories">Gênero espírita</Label>
              <Input
                id="categories"
                list="spiritist-genres"
                placeholder="Ex: Romance Espírita, Codificação Kardecista"
                value={categoriesInput}
                onChange={(e) => setCategoriesInput(e.target.value)}
              />
              <datalist id="spiritist-genres">
                {SPIRITIST_GENRES.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
              <p className="text-xs text-slate-500">Separe vários gêneros por vírgula.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection">Coleção / Série</Label>
              <Input id="collection" name="collection" placeholder="Ex: Série André Luiz, Biblioteca do Além" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Publicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="publisher">Editora</Label>
                <Input id="publisher" name="publisher" placeholder="Ex: FEB, IDE" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Ano de publicação</Label>
                <Input id="year" name="year" type="number" inputMode="numeric" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="edition">Edição</Label>
                <Input id="edition" name="edition" placeholder="Ex: 12ª ed." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pages">Páginas</Label>
                <Input id="pages" name="pages" type="number" inputMode="numeric" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input id="isbn" name="isbn" inputMode="numeric" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Input id="language" name="language" placeholder="Ex: Português" defaultValue="Português" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conteúdo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">URL da capa</Label>
              <Input
                id="coverImageUrl"
                name="coverImageUrl"
                type="url"
                inputMode="url"
                placeholder="https://exemplo.com/capa.jpg"
              />
              <p className="text-xs text-slate-500">
                Link HTTPS público da imagem (ex.: site da editora). Apenas administradores podem
                cadastrar capas.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="synopsis">Sinopse / Apresentação</Label>
              <Textarea
                id="synopsis"
                name="synopsis"
                rows={4}
                placeholder="Resumo da obra para consulta no acervo e no assistente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={2}
                placeholder="Notas internas da biblioteca (doação, estado, etc.)"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Salvando..." : "Salvar obra"}
          </Button>
        </div>
      </form>
    </div>
  );
}
