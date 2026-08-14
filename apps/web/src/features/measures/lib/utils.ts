import JSZip from "jszip";
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
  // En cualquier otro caso, devolvemos el valor
  return sub as string;
};

export const generateUniqueFolderName = (zip: JSZip, baseName: string) => {
  const existingFolders = new Set(
    Object.keys(zip.files)
      .filter((name) => name.endsWith("/")) // Solo carpetas
      .map((name) => name.slice(0, -1)) // Eliminar la barra final
  );

  let folderName = baseName;
  let counter = 1;

  while (existingFolders.has(folderName)) {
    folderName = `${baseName}_${counter}`;
    counter++;
  }

  return folderName;
};

export const getAnswerValue = (answer: string | null): AnswerReport => {
  if (answer === null) return "N/A";
  return answer === "1" ? "Sí" : "No";
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Item = { [key: string]: any };

// Función auxiliar para acceder a propiedades anidadas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedValue(obj: Item, path: string | string[]): any {
  const keys = Array.isArray(path) ? path : path.split(".");
  return keys.reduce((acc, key) => acc?.[key], obj);
}

export function groupByNested<T extends Item>(
  array: T[],
  path: string | string[]
): { [key: string]: T[] } {
  return array.reduce(
    (result, item) => {
      const groupKey = String(getNestedValue(item, path));
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as { [key: string]: T[] }
  );
}

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
