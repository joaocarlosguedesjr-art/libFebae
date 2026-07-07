import { describe, expect, it } from "vitest";
import { isSafeExternalImageUrl, sanitizeCoverImageUrl } from "./safe-image-url";

describe("isSafeExternalImageUrl", () => {
  it("aceita HTTPS público", () => {
    expect(isSafeExternalImageUrl("https://covers.example.com/livro.jpg")).toBe(true);
  });

  it("rejeita HTTP", () => {
    expect(isSafeExternalImageUrl("http://example.com/a.jpg")).toBe(false);
  });

  it("rejeita javascript:", () => {
    expect(isSafeExternalImageUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejeita data:", () => {
    expect(isSafeExternalImageUrl("data:image/png;base64,abc")).toBe(false);
  });

  it("rejeita localhost", () => {
    expect(isSafeExternalImageUrl("https://localhost/capa.jpg")).toBe(false);
  });

  it("rejeita IP privado", () => {
    expect(isSafeExternalImageUrl("https://192.168.1.1/capa.jpg")).toBe(false);
    expect(isSafeExternalImageUrl("https://127.0.0.1/capa.jpg")).toBe(false);
  });

  it("rejeita credenciais na URL", () => {
    expect(isSafeExternalImageUrl("https://user:pass@example.com/a.jpg")).toBe(false);
  });
});

describe("sanitizeCoverImageUrl", () => {
  it("retorna null para URL insegura", () => {
    expect(sanitizeCoverImageUrl("http://bad.com/x.jpg")).toBeNull();
  });

  it("retorna URL segura", () => {
    expect(sanitizeCoverImageUrl("https://good.com/x.jpg")).toBe("https://good.com/x.jpg");
  });
});
