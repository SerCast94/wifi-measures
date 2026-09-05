import type {
  CreateLoraMeasureInput,
  CreateLoraNoiseInput,
  LoraMeasureBlockInput,
  LoraNoiseEntryInput,
} from "../api/lora-api";

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  }
  return rows;
}

const normalize = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

const toNum = (value: string | undefined | null): number | null => {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
};

const getRowCell = (row: string[], idx: number): string | undefined =>
  idx >= 0 && idx < row.length ? row[idx] : undefined;

interface BlockIndexes {
  totalPackets: number;
  successfulPackets: number;
  rssi: number;
  snr: number;
  packetLossPct: number;
  longitude: number;
  latitude: number;
  location: number;
}

function findBlockIndexes(headers: string[], role: "master" | "slave"): BlockIndexes {
  const norm = headers.map(normalize);
  const find = (frag: string): number => {
    const key = normalize(frag);
    return norm.findIndex(
      (k) => k.startsWith(key) && (k.endsWith(role) || k === key)
    );
  };
  return {
    totalPackets: find("totalpackets"),
    successfulPackets: find("successfulpackets"),
    rssi: find("rssi"),
    snr: find("snr"),
    packetLossPct: find("packetloss"),
    longitude: find("longitude"),
    latitude: find("latitude"),
    location: find("location"),
  };
}

function buildBlock(
  row: string[],
  indexes: BlockIndexes,
  role: "Master" | "Slave"
): LoraMeasureBlockInput | null {
  const get = (idx: number) => getRowCell(row, idx);
  const block: LoraMeasureBlockInput = {
    role,
    totalPackets: toNum(get(indexes.totalPackets)),
    successfulPackets: toNum(get(indexes.successfulPackets)),
    rssi: toNum(get(indexes.rssi)),
    snr: toNum(get(indexes.snr)),
    packetLossPct: toNum(get(indexes.packetLossPct)),
    longitude: toNum(get(indexes.longitude)),
    latitude: toNum(get(indexes.latitude)),
    location: get(indexes.location)?.trim() || null,
  };
  const hasData = Object.values(block).some(
    (v) => v !== null && v !== undefined && v !== ""
  );
  return hasData ? block : null;
}

export function parseLoraMeasuresCsv(text: string): CreateLoraMeasureInput[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const headers = rows[0];
  const dataRows = rows.slice(1);

  const norm = headers.map(normalize);
  const findPlain = (frag: string): number => {
    const key = normalize(frag);
    return norm.findIndex((k) => k === key || k.startsWith(key));
  };

  const timeIdx = findPlain("time");
  const txIdx = findPlain("txpower");
  const sfIdx = findPlain("sf");

  const results: CreateLoraMeasureInput[] = [];

  for (const dataRow of dataRows) {
    const blocks: LoraMeasureBlockInput[] = [];
    for (const role of ["master", "slave"] as const) {
      const indexes = findBlockIndexes(headers, role);
      const block = buildBlock(
        dataRow,
        indexes,
        role === "master" ? "Master" : "Slave"
      );
      if (block) blocks.push(block);
    }

    const time =
      timeIdx >= 0 ? getRowCell(dataRow, timeIdx)?.trim() || null : null;
    const txPower =
      txIdx >= 0 ? getRowCell(dataRow, txIdx)?.trim() || null : null;
    const spreadingFactor =
      sfIdx >= 0 ? getRowCell(dataRow, sfIdx)?.trim() || null : null;
    const location = blocks.find((b) => b.location)?.location ?? null;

    if (blocks.length > 0) {
      results.push({ location, time, txPower, spreadingFactor, blocks });
    }
  }

  return results;
}

export function parseLoraNoiseCsv(text: string): CreateLoraNoiseInput[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const headers = rows[0];
  const norm = headers.map(normalize);
  const find = (frags: string[]): number => {
    for (const frag of frags) {
      const key = normalize(frag);
      const idx = norm.findIndex((k) => k === key || k.startsWith(key));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idx = {
    frequency: find(["frequency", "freq"]),
    currentScan: find(["currentscan", "current", "scancurrent"]),
    weightedAverageScan: find(["weightedaveragescan", "mediasponderada", "weightedaverage"]),
    location: find(["location", "ubicacion"]),
    longitude: find(["longitude", "lon", "long"]),
    latitude: find(["latitude", "lat"]),
  };

  const dataRows = rows.slice(1);
  const firstRow = dataRows[0] ?? [];

  const entries: LoraNoiseEntryInput[] = dataRows
    .map((row) => ({
      frequency: idx.frequency >= 0 ? toNum(getRowCell(row, idx.frequency)) : null,
      currentScan:
        idx.currentScan >= 0 ? toNum(getRowCell(row, idx.currentScan)) : null,
      weightedAverageScan:
        idx.weightedAverageScan >= 0
          ? toNum(getRowCell(row, idx.weightedAverageScan))
          : null,
    }))
    .filter(
      (entry) =>
        entry.frequency !== null ||
        entry.currentScan !== null ||
        entry.weightedAverageScan !== null
    );

  if (entries.length === 0) return [];

  return [
    {
      location: getRowCell(firstRow, idx.location)?.trim() || null,
      longitude: idx.longitude >= 0 ? toNum(getRowCell(firstRow, idx.longitude)) : null,
      latitude: idx.latitude >= 0 ? toNum(getRowCell(firstRow, idx.latitude)) : null,
      entries,
    },
  ];
}
