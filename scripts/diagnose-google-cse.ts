import { config } from "dotenv";

config({ override: true });

const apiKey = process.env.GOOGLE_CSE_API_KEY?.trim();
const cx = process.env.GOOGLE_CSE_CX?.trim();

async function main() {
  if (!apiKey || !cx) {
    console.error("Faltam GOOGLE_CSE_API_KEY ou GOOGLE_CSE_CX no .env");
    process.exit(1);
  }

  console.log("Diagnóstico Google Custom Search API\n");
  console.log(`API Key: configurada (${apiKey.slice(0, 8)}...${apiKey.slice(-4)})`);
  console.log(`CX (motor): ${cx}`);
  console.log(`Tamanho CX: ${cx.length} caracteres\n`);

  const params = new URLSearchParams({
    key: apiKey,
    cx,
    q: '"Nosso Lar" André Luiz sinopse',
    num: "3",
    gl: "br",
    lr: "lang_pt",
  });

  const url = `https://www.googleapis.com/customsearch/v1?${params}`;
  const response = await fetch(url);
  const body = await response.json();

  console.log(`HTTP Status: ${response.status} ${response.statusText}`);
  console.log("Resposta completa da API:");
  console.log(JSON.stringify(body, null, 2));

  if (response.ok && body.items?.length) {
    console.log("\n✓ API funcionando — primeiro resultado:", body.items[0].link);
    return;
  }

  console.log("\n--- Análise do erro ---");
  const message: string = body.error?.message ?? "desconhecido";
  const reason: string = body.error?.errors?.[0]?.reason ?? body.error?.status ?? "";
  const domain: string = body.error?.errors?.[0]?.domain ?? "";

  console.log(`Mensagem: ${message}`);
  console.log(`Reason: ${reason}`);
  console.log(`Domain: ${domain}`);

  if (message.toLowerCase().includes("referer")) {
    console.log(`
PROBLEMA: Restrição de REFERER na API Key
A chave ainda está configurada para "Referenciadores HTTP (sites)".
Scripts de terminal não enviam referer → Google bloqueia.

CORREÇÃO:
1. https://console.cloud.google.com/apis/credentials
2. Clique na API Key usada no .env
3. "Restrições de aplicativo" → escolha "Nenhuma"
   (ou "Endereços IP" se preferir mais segurança)
4. Salvar e aguardar 1-5 minutos
5. Rode novamente: npx tsx scripts/test-google-cse.ts
`);
  } else if (
    reason === "forbidden" &&
    (message.includes("customsearch") || message.includes("are blocked"))
  ) {
    const details = body.error?.details ?? [];
    const apiBlocked = details.some(
      (d: { reason?: string }) => d.reason === "API_KEY_SERVICE_BLOCKED"
    );
    console.log(`
PROBLEMA: ${apiBlocked ? "API_KEY_SERVICE_BLOCKED" : "Custom Search API bloqueada"}
${apiBlocked ? `
⚠️  CAUSA MAIS PROVÁVEL (2026): A Custom Search JSON API está FECHADA para novos clientes.
    Projetos Google Cloud criados recentemente NÃO conseguem usar essa API,
    mesmo com chave, CX e billing corretos.

    Documentação oficial:
    https://developers.google.com/custom-search/v1/overview
    "This API is not available for new customers."

    O erro persiste após "corrigir" restrições da chave porque o bloqueio
    é no PROJETO/conta, não na configuração da API Key.

ALTERNATIVAS:
  1) Usar um projeto Google Cloud ANTIGO (cliente existente antes do fechamento)
  2) Migrar o pipeline para busca direta em febrasil.org.br / ide.espirito.org.br
  3) Usar API de busca paga (SerpAPI, etc.) como substituto do Google CSE
  4) Vertex AI Search (alternativa oficial Google, mais complexa)
` : ""}
Se ainda for cliente existente, verifique também:

A) Ativar a API no projeto:
   https://console.cloud.google.com/apis/library/customsearch.googleapis.com

B) Liberar a API na chave:
   https://console.cloud.google.com/apis/credentials
   → Restrições de API → incluir "Custom Search API"
   → Restrições de aplicativo → "Nenhuma"

Teste: npx tsx scripts/test-google-cse.ts
`);
  } else if (reason === "accessNotConfigured" || message.includes("has not been used")) {
    console.log(`
PROBLEMA: Custom Search API não está ativada no projeto.
CORREÇÃO: Ative em https://console.cloud.google.com/apis/library/customsearch.googleapis.com
`);
  } else if (message.includes("Invalid Value") || reason === "invalid") {
    console.log(`
PROBLEMA: CX (Search Engine ID) inválido ou motor inexistente.
CORREÇÃO: Verifique o ID em https://programmablesearchengine.google.com/controlpanel/all
`);
  } else if (reason === "dailyLimitExceeded" || response.status === 429) {
    console.log(`
PROBLEMA: Cota diária esgotada (100 buscas/dia no plano gratuito).
CORREÇÃO: Aguarde até amanhã ou habilite faturamento no Google Cloud.
`);
  }
}

main().catch((error) => {
  console.error("Falha de rede:", error);
  process.exit(1);
});
