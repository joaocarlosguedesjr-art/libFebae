# Pontos de atenção LGPD — Biblioteca Espírita

Documento de referência para conformidade com a **Lei nº 13.709/2018 (LGPD)** e boas práticas da ANPD.

**Versão:** 1.0 · **Data:** julho/2026

---

## 1. Dados pessoais tratados pelo sistema

| Dado | Titulares | Finalidade | Base legal (art. 7º) |
|------|-----------|------------|----------------------|
| Nome | Leitores, bibliotecários | Identificação e gestão de empréstimos | V (execução de procedimentos) / IX (legítimo interesse) |
| E-mail | Leitores, bibliotecários | Autenticação e comunicação | V |
| CPF (opcional) | Leitores | Evitar duplicidade e vincular empréstimos | I (consentimento) / IX |
| Senha (hash) | Todos autenticados | Segurança de acesso | V |
| Histórico de empréstimos | Leitores | Controle do acervo e devoluções | V / IX |
| Mensagens do assistente | Visitantes do catálogo | Busca no acervo (não persistidas) | IX (legítimo interesse) |

---

## 2. O que o sistema implementa

| Requisito LGPD | Implementação |
|----------------|---------------|
| Transparência (art. 9º) | `/privacidade` — Política de Privacidade |
| Termos de uso | `/termos` |
| Direitos do titular (arts. 17–22) | `/lgpd`, `/meus-dados`, solicitações formais |
| Consentimento (art. 7º, I) | Aceite no cadastro (admin) e no 1º acesso (`/privacidade/aceite`) |
| Registro de consentimento (art. 37) | Campos `privacyAcceptedAt`, `termsAcceptedAt`, versão, método e admin responsável |
| Minimização (art. 6º, III) | CPF mascarado em listagens e APIs |
| Segurança (art. 46) | Senhas com bcrypt, HTTPS em produção, controle por perfil |
| Canal com encarregado | `dpoEmail` em `AppConfig` e páginas legais |
| Atendimento a solicitações | `/lgpd/solicitacoes` (admin) + API `/api/lgpd/requests` |

---

## 3. Fluxos implementados

### 3.1 Cadastro de leitor (bibliotecário)

1. Bibliotecário preenche dados em `/usuarios/novo`
2. Marca declarações LGPD (titular informado + consentimento)
3. Sistema registra consentimento com `ADMIN_REGISTRATION` e ID do admin

### 3.2 Primeiro acesso do usuário

1. Login em `/login`
2. Se política/termos mudaram ou nunca aceitos → `/privacidade/aceite`
3. Aceite registrado com `SELF_ACCEPTANCE`

### 3.3 Exercício de direitos pelo titular

1. Acesso autenticado em `/meus-dados`
2. Consulta dados, corrige cadastro, vê empréstimos
3. Abre solicitação formal (acesso, correção, eliminação, etc.)
4. Bibliotecário responde em `/lgpd/solicitacoes`

---

## 4. Ações obrigatórias da instituição (fora do software)

- [ ] Preencher dados reais em **Configurações** (`/configuracoes`): nome da instituição, endereço, e-mail do encarregado (DPO)
- [ ] Revisar textos de `/privacidade` e `/termos` com assessoria jurídica
- [ ] Definir prazo interno de resposta às solicitações (sugestão: 15 dias)
- [ ] Treinar bibliotecários sobre coleta de consentimento no balcão
- [ ] Manter registro de atendimentos presenciais não cobertos pelo sistema
- [ ] Revisão anual desta política e das versões (`privacyPolicyVersion`, `termsVersion`)

---

## 5. Atualização de versão da política

Ao alterar substantivamente a política ou os termos:

1. Incrementar `privacyPolicyVersion` ou `termsVersion` em `AppConfig`
2. Usuários com versão antiga serão direcionados a `/privacidade/aceite` no próximo login
3. Registrar a alteração no `CHANGELOG.md`

---

## 6. Eliminação e retenção

- **Empréstimos ativos:** não eliminar cadastro do titular sem quitar pendências
- **Eliminação:** atender via solicitação LGPD; anonimizar ou excluir dados, mantendo apenas o exigido por lei
- **Backups:** considerar prazo de retenção do provedor (Neon) na resposta ao titular

---

## 7. Limitações atuais (roadmap)

| Item | Status |
|------|--------|
| Exportação JSON/portabilidade automática | Parcial (visualização em Meus dados) |
| Logs de auditoria de quem acessou CPF | Planejado |
| Cookie banner | Não necessário hoje (sem analytics de terceiros) |
| RIPD (relatório de impacto) | Avaliar se volume de dados exigir |

---

## 8. Referências legais

- Lei nº 13.709/2018 (LGPD)
- Lei nº 12.965/2014 (Marco Civil da Internet)
- Guia ANPD — [gov.br/anpd](https://www.gov.br/anpd)
