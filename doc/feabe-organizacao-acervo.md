# Organização do acervo FEABE

Documento de referência — julho/2026.

## Numeração atual (v2)

### Obra (título único + autor espiritual)

Numeração **sequencial de 1 a 925**, redistribuída por:

1. **Seção** — Codificação → Romances → Estudos → Biografias → …
2. **Autor / espírito** — ex.: Allan Kardec, Emmanuel, André Luiz, Joanna de Ângelis
3. **Médium** — quando o mesmo espírito aparece por médiuns diferentes
4. **Título** — ordem alfabética

Cada obra recebe um **nº obra** inteiro: `1`, `2`, … `925`.

### Exemplar físico

| Situação | Nº exemplar |
|----------|-------------|
| 1 só exemplar da obra | `100` (igual ao nº obra) |
| 2+ exemplares iguais | `100.1`, `100.2`, `100.3` … |

Exemplo — *Redenção* (Ivone Amaral Pereira), 2 cópias:

| Nº obra | Nº exemplar | Nº legado (Table 1) |
|--------:|-------------|--------------------:|
| 42 | 42.1 | 6 |
| 42 | 42.2 | 7 |

### Histórico preservado

Cada linha mantém:

- **Nº legado** — número original da planilha (Table 1)
- **Ordem estante** — ordem da Table 2
- **Histórico** — texto com referência cruzada obra ↔ legado

## Arquivos gerados

```bash
npm run catalog:enrich
```

| Arquivo | Conteúdo |
|---------|----------|
| `data/feabe-acervo-enriquecido.csv` | 1.161 exemplares com nova numeração |
| `data/feabe-acervo-enriquecido.xlsx` | Mesma base em Excel |
| `data/feabe-catalogo-resumo.json` | Estatísticas |

## Importação no sistema

```bash
npm run db:migrate          # aplica workNumber no schema
npm run catalog:import:dry  # simula
npm run catalog:import      # grava no PostgreSQL
```
