# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [0.0.1] - 2026-07-03

### Adicionado

- Plano de implementação em `doc/plano-de-implementacao.md`
- Migration inicial PostgreSQL (`prisma/migrations/20260703120000_init`)
- Workflow CI (`.github/workflows/ci.yml`)
- Script `admin:create` para criar administrador em produção
- Flag `SEED_DEMO` para controlar seed de demonstração

### Alterado

- Schema Prisma de SQLite para PostgreSQL
- `vercel.json`: build sem `db push` nem seed automático
- `.env.example` e scripts de banco alinhados ao fluxo de produção
- Versão do pacote definida como `0.0.1`

### Segurança

- Seed de demonstração não roda em produção por padrão

[0.0.1]: https://github.com/seu-usuario/biblioteca/compare/v0.0.0...v0.0.1
