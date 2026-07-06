/** Remove caracteres não numéricos e limita a 11 dígitos */
export function stripCpf(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

/** Máscara progressiva: 000.000.000-00 */
export function formatCpfInput(value: string): string {
  const digits = stripCpf(value);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Valida dígitos verificadores do CPF brasileiro */
export function isValidCpf(cpf: string): boolean {
  const digits = stripCpf(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calcCheck = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += parseInt(digits[i], 10) * (length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return (
    calcCheck(9) === parseInt(digits[9], 10) &&
    calcCheck(10) === parseInt(digits[10], 10)
  );
}

export function maskCpf(cpf: string | null | undefined): string {
  if (!cpf || cpf.length < 11) return "—";
  return `***.***.***-${cpf.slice(-2)}`;
}

/** Formata 11 dígitos para 000.000.000-00 */
export function formatCpf(cpf: string): string {
  const digits = stripCpf(cpf);
  if (digits.length !== 11) return cpf;
  return formatCpfInput(digits);
}
