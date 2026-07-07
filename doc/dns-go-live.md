# Manual DNS — bibliotecafeabe.com.br (Registro.br + Vercel)

Domínio canônico: **https://www.bibliotecafeabe.com.br**

---

## Antes de começar — leia isto

No Registro.br existem **duas telas diferentes**. Muita gente confunde:

| Tela no Registro.br | Para que serve | O que colocar |
|---------------------|----------------|---------------|
| **Alterar servidores DNS** | Trocar *quem gerencia* o DNS | Nomes como `ns1.vercel-dns.com` — **nunca IPs** |
| **Configurar zona DNS** / **Modo avançado** | Apontar o site para a Vercel | Registros **A** (IPs) e **CNAME** |

Você precisa da **segunda** opção. **Não** coloque IPs em “Servidor 1 / Servidor 2”.

---

## Passo a passo no Registro.br

### Passo 1 — Entrar no painel

1. Acesse [https://registro.br](https://registro.br)
2. Clique em **Acessar conta** (canto superior direito)
3. Faça login
4. Clique no domínio **`bibliotecafeabe.com.br`**

---

### Passo 2 — Usar DNS do Registro.br (se ainda não estiver)

Na página do domínio, role até a seção **DNS**.

- Se aparecer **“Utilizar DNS do Registro.br”** → clique nesse botão e confirme.
- **Não** clique em “Alterar servidores DNS” para colocar IPs.

Aguarde alguns minutos se acabou de ativar.

---

### Passo 3 — Abrir o modo avançado (onde entram os IPs)

1. Na seção **DNS**, clique em **Configurar endereçamento**
2. Clique em **Modo avançado**
3. Clique em **Confirmar** na mensagem de aviso
4. Aguarde **5 a 120 minutos** (em alguns casos o Registro.br demora)
5. **Atualize a página** (F5) até aparecer **Configurar zona DNS** ou **Editar zona**

> Se **“Configurar endereçamento”** ou **“Modo avançado”** não aparecer, o domínio pode estar usando DNS de outro provedor. Nesse caso, use **“Utilizar DNS do Registro.br”** primeiro.

---

### Passo 4 — Adicionar os registros da Vercel

Clique em **Configurar zona DNS** (ou **Editar zona**) → **Nova entrada**.

Adicione **um por vez**, nesta ordem:

#### Entrada 1 — A (raiz do domínio)

| Campo | Valor |
|-------|-------|
| **Tipo** | `A` |
| **Nome** | deixe **em branco** (ou `@`) |
| **Endereço / Valor** | `216.198.79.1` |

Clique em **Adicionar**.

#### Entrada 2 — A (segundo IP da Vercel)

| Campo | Valor |
|-------|-------|
| **Tipo** | `A` |
| **Nome** | deixe **em branco** (ou `@`) |
| **Endereço / Valor** | `64.29.17.1` |

Clique em **Adicionar**.

#### Entrada 3 — CNAME (www)

| Campo | Valor |
|-------|-------|
| **Tipo** | `CNAME` |
| **Nome** | `www` |
| **Nome do servidor / Destino** | `e21cdd72772cb49e.vercel-dns-017.com` |

Clique em **Adicionar**.

---

### Passo 5 — Salvar

1. Revise as 3 entradas na lista
2. Clique em **Salvar alterações**
3. Aguarde **5 a 30 minutos** (às vezes até 2 h) para propagar

---

## Como deve ficar a zona DNS

```
Tipo    Nome    Valor
----    ----    -----
A       @       216.198.79.1
A       @       64.29.17.1
CNAME   www     e21cdd72772cb49e.vercel-dns-017.com
```

---

## Erros comuns

### “Endereços IP não podem ser usados como servidores DNS”

Você está em **Alterar servidores DNS**. Cancele e siga o **Passo 3** (Modo avançado → Zona DNS).

### Não aparece “Editar zona” / “Configurar zona DNS”

1. Clique em **Utilizar DNS do Registro.br**
2. Ative o **Modo avançado** e aguarde
3. Atualize a página depois de 10–30 min

### Coloquei IP no lugar errado

Apague a entrada (ícone **X** ao lado) e crie de novo. No Registro.br **não dá para editar** — só excluir e recriar.

---

## Verificar se funcionou

No computador do projeto:

```bash
npm run dns:verify
```

Ou no PowerShell:

```powershell
Resolve-DnsName bibliotecafeabe.com.br -Type A -Server 8.8.8.8
Resolve-DnsName www.bibliotecafeabe.com.br -Type CNAME -Server 8.8.8.8
```

Quando OK, abra: **https://www.bibliotecafeabe.com.br**

---

## Status do projeto (app)

| Item | Status |
|------|--------|
| Deploy Vercel | ✓ Produção ativa |
| Domínios no projeto | ✓ `www` + raiz |
| `NEXTAUTH_URL` / `DATABASE_URL` | ✓ Sincronizados |
| DNS Registro.br | ✓ Verificado (`npm run dns:verify`) |

---

## `ERR_CONNECTION_CLOSED` — DNS OK, site não abre

Se `npm run dns:verify` passou mas o navegador mostra *“encerrou a conexão inesperadamente”*, o DNS já está certo. O problema costuma ser **proteção Vercel**, **deploy quebrado** ou **certificado SSL em emissão**.

### A) Desativar login Vercel no site (prioridade)

1. [vercel.com](https://vercel.com) → projeto **lib-febae**
2. **Settings** → **Deployment Protection**
3. **Vercel Authentication** → desativar para **Production** (ou *Standard Protection*)
4. **Save**

Sem isso, até `*.vercel.app` pede login da Vercel.

### B) Deploy de produção ativo

1. **Deployments** → último status **Ready** (verde)
2. Menu **⋯** → **Promote to Production**

Se todos estiverem **Error**:

```bash
npx vercel --prod --yes
```

### C) IPs no Registro.br (terminam em `.1`)

| Tipo | Nome | Valor |
|------|------|-------|
| A | `@` | `216.198.79.1` |
| A | `@` | `64.29.17.1` |
| CNAME | `www` | `e21cdd72772cb49e.vercel-dns-017.com` |

### D) Aguardar SSL (até 24 h)

Em **Settings → Domains**, confira certificado ativo após o DNS propagar.

### E) Cache local

```powershell
ipconfig /flushdns
```

Teste em aba anônima ou no celular (4G).

---

## Referência rápida — Vercel

Domínios já adicionados no projeto `lib-febae`:

- `www.bibliotecafeabe.com.br` (principal)
- `bibliotecafeabe.com.br` (redireciona para www)

Variáveis importantes na Vercel:

| Variável | Valor |
|----------|-------|
| `NEXTAUTH_URL` | `https://www.bibliotecafeabe.com.br` |
| `DATABASE_URL` | Connection string Neon |
| `SEED_DEMO` | `false` |

---

## Fluxo visual (resumo)

```
registro.br
  └── Login
       └── Domínio bibliotecafeabe.com.br
            └── DNS
                 └── Configurar endereçamento    ← AQUI (não "Alterar servidores DNS")
                      └── Modo avançado → Confirmar
                           └── (aguardar)
                                └── Configurar zona DNS
                                     └── Nova entrada → A / CNAME
                                          └── Salvar alterações
```
