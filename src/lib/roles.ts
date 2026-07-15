export type UserRole = "ADMIN" | "BIBLIOTECARIO" | "READER";

export function isAdmin(role: string | undefined): boolean {
  return role === "ADMIN";
}

export function isBibliotecario(role: string | undefined): boolean {
  return role === "BIBLIOTECARIO";
}

export function isStaff(role: string | undefined): boolean {
  return role === "ADMIN" || role === "BIBLIOTECARIO";
}

export function roleLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "BIBLIOTECARIO":
      return "Bibliotecário";
    case "READER":
      return "Leitor";
    default:
      return role;
  }
}
