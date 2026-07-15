import { fetchPageHtml } from "../src/lib/book-enrichment/page-fetcher";

async function main() {
  const url =
    "https://www.livrariaespirita.org.br/catalogsearch/result/?" +
    new URLSearchParams({ q: "Desobsessao" }).toString();
  const fetched = await fetchPageHtml(url);
  if (!fetched.html) return;
  let idx = 0;
  let n = 0;
  while (n < 3) {
    idx = fetched.html.indexOf("product-name", idx);
    if (idx < 0) break;
    console.log("\n--- snippet", n);
    console.log(fetched.html.slice(idx, idx + 450));
    idx += 12;
    n++;
  }
}

main().catch(console.error);
