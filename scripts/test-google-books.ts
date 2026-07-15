import { config } from "dotenv";

config({ override: true });

async function main() {
  const key = process.env.GOOGLE_CSE_API_KEY?.trim();
  if (!key) {
    console.error("Sem GOOGLE_CSE_API_KEY");
    process.exit(1);
  }

  const url =
    "https://www.googleapis.com/books/v1/volumes?" +
    new URLSearchParams({
      q: 'intitle:"Nosso Lar" Xavier',
      maxResults: "3",
      langRestrict: "pt",
      printType: "books",
      key,
    }).toString();

  const response = await fetch(url);
  const body = await response.json();
  console.log("HTTP", response.status);
  if (!response.ok) {
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  for (const item of body.items ?? []) {
    const info = item.volumeInfo ?? {};
    console.log("-", info.title);
    console.log("  authors:", (info.authors ?? []).join(", "));
    console.log("  desc:", String(info.description ?? "").slice(0, 140));
    console.log("  image:", info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail);
  }
}

main().catch(console.error);
