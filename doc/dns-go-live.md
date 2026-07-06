# DNS — bibliotecafeabe.com.br

Domínio canônico: **https://www.bibliotecafeabe.com.br**

## 1. Vercel (após deploy com sucesso)

No painel do projeto `lib-febae` → **Settings → Domains**, adicione:

- `www.bibliotecafeabe.com.br` (principal)
- `bibliotecafeabe.com.br` (redireciona para www via `vercel.json`)

Ou via CLI:

```bash
npx vercel domains add www.bibliotecafeabe.com.br lib-febae
npx vercel domains add bibliotecafeabe.com.br lib-febae
npx vercel domains inspect www.bibliotecafeabe.com.br
```

## 2. Registros DNS (no provedor do domínio)

Após adicionar o domínio na Vercel, use os valores que ela exibir. Em geral:

| Tipo  | Nome | Valor                    |
|-------|------|--------------------------|
| CNAME | www  | `cname.vercel-dns.com`   |
| A     | @    | `76.76.21.21`            |

> O registro **A** na raiz (`@`) aponta o domínio sem www para a Vercel; o redirect para `www` é feito pelo app.

Propagação: de alguns minutos até 48 h.

## 3. Verificar

```bash
npx vercel domains verify www.bibliotecafeabe.com.br
```

## 4. Variáveis na Vercel

| Variável       | Valor                                      |
|----------------|--------------------------------------------|
| `NEXTAUTH_URL` | `https://www.bibliotecafeabe.com.br`       |
| `DATABASE_URL` | Connection string do Neon                  |
| `AUTH_SECRET`  | Secret forte (32+ caracteres)              |
| `SEED_DEMO`    | `false`                                    |

Sincronizar do `.env` local:

```bash
node scripts/sync-vercel-env.mjs
```
