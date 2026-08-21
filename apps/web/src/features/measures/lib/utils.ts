import type { AnswerReport } from "../types/responses.types";

export const getBooleanFromApi = (sub: [] | string): boolean | null => {
  // Si el valor es un array vacío, devolvemos null
  if (Array.isArray(sub) && sub.length === 0) return null;
  // Si el valor es "1", devolvemos true
  if (sub === "1") return true;
  // Si el valor es "0", devolvemos false
  if (sub === "0") return false;
  // En cualquier otro caso, devolvemos null
  return null;
};

export const getStringFromApi = (sub?: [] | string): string | null => {
  if (sub === undefined) return null;
  // Si el valor es un array vacío, devolvemos null
  if (Array.isArray(sub) && sub.length === 0) return null;
  return sub as string;
};

export const getAnswerValue = (answer: string | null): AnswerReport => {
  if (answer === null) return "N/A";
  return answer === "1" ? "Sí" : "No";
};

export function decimalToString(value?: number | null, decimals = 2) {
  if (value === null || value === undefined) return "";
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatScientific(num?: number | null, decimals = 2): string {
  if (num === null || num === undefined) return "";
  // Convierte a notación científica con punto
  const exp = num.toExponential(decimals); // p. ej. "1.10e-4"
  // Reemplaza el separador decimal y ajusta la E mayúscula
  return exp.replace(".", ",").replace("e", "E");
}
