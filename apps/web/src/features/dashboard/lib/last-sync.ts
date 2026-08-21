const STORAGE_KEY = "wifi-measures:last-sync";

export type SyncSource = "measures" | "surveys" | "analyses";

export const getLastSync = (source: SyncSource): Date | null => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}:${source}`);
    if (!raw) return null;
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};

export const setLastSync = (source: SyncSource, date: Date = new Date()): void => {
  try {
    localStorage.setItem(`${STORAGE_KEY}:${source}`, date.toISOString());
  } catch {
    // almacenamiento no disponible: se ignora
  }
};
