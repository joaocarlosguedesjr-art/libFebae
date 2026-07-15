import { config } from "dotenv";

config({ override: true });

async function get(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "BibliotecaFEABE-Enrichment/1.0",
      Accept: "application/json",
    },
  });
  const text = await response.text();
  console.log("\n===", url);
  console.log("status", response.status);
  console.log(text.slice(0, 1200));
}

async function main() {
  await get(
    "https://openlibrary.org/search.json?q=Nosso+Lar+Francisco+Candido+Xavier&limit=5&fields=key,title,author_name,publisher,first_sentence,cover_i,isbn,number_of_pages_median"
  );
  await get(
    "https://www.googleapis.com/books/v1/volumes?q=intitle:%22Nosso+Lar%22+inauthor:Xavier&maxResults=5&langRestrict=pt&printType=books"
  );
}

main().catch(console.error);
