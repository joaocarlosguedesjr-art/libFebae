# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [0.0.2] - 2026-07-09

### Adicionado

- Recuperação de senha com código OTP por e-mail
- Renovação e solicitação de devolução de empréstimos, com confirmação do bibliotecário
- Lembretes de empréstimo por e-mail com ações de renovar e solicitar devolução
- Página pública de sinopse ao clicar em obra no catálogo
- Empréstimo direto do bibliotecário (leitor + catálogo + exemplar), sem aprovação

### Alterado

- Devolução final exige confirmação do admin após entrega física do livro
- Status de empréstimo `RETURN_REQUESTED` para solicitações pendentes

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

[0.0.2]: https://github.com/joaocarlosguedesjr-art/libFebae/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/seu-usuario/biblioteca/compare/v0.0.0...v0.0.1
