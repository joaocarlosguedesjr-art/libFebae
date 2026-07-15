import { config } from "dotenv";
import { getGoogleCseConfig, GoogleCseClient } from "../src/lib/book-enrichment/google-cse";

config({ override: true });

const cfg = getGoogleCseConfig();
if (!cfg) {
  console.error("GOOGLE_CSE_API_KEY ou GOOGLE_CSE_CX ausente");
  process.exit(1);
}

const client = new GoogleCseClient(cfg);
client
  .search('"Nosso Lar" "André Luiz" sinopse', 3)
  .then((results) => {
    console.log("OK:", results.length, "resultado(s)");
    if (results[0]) console.log("  1º:", results[0].link);
  })
  .catch((error: Error) => {
    console.error("ERRO:", error.message);
    process.exitCode = 1;
  });
