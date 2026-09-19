import type {
  CreateLoraMeasureInput,
  CreateLoraNoiseInput,
  LoraNoiseEntryInput,
  LoraSampleInput,
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

const toInt = (value: string | undefined | null): number | null => {
  const num = toNum(value);
  return num === null || !Number.isInteger(num) ? null : num;
};

/**
 * Parsea una coordenada, aceptando tanto decimal ("3.777117", "-3.777117")
 * como el formato DMS del escáner ("3.777117°W", "38.09219°N", "3.777117 W").
 */
const toCoord = (value: string | undefined | null): number | null => {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "-") return null;
  const match = trimmed.match(/^([-\d.]+)\s*°?\s*([NSEW])?$/i);
  if (match) {
    let num = Number(match[1]);
    const hemisphere = (match[2] ?? "").toUpperCase();
    if (hemisphere === "S" || hemisphere === "W") num *= -1;
    return Number.isNaN(num) ? null : num;
  }
  return toNum(trimmed);
};

const getRowCell = (row: string[], idx: number): string | undefined =>
  idx >= 0 && idx < row.length ? row[idx] : undefined;

interface CsvIndex {
  txCnt: number;
  time: number;
  rssi: number;
  rssis: number;
  snr: number;
  signal: number;
  uplinkPacket: number;
  confirmPacket: number;
  packetLossPct: number;
  longitude: number;
  latitude: number;
  location: number;
  sf: number;
  txPower: number;
}

/**
 * El escáner produej en un fichero por sesión. Cada fila es una muestra:
 * Tx Cnt, Time, RSSI (dBm), RSSIS (dBm), SNR (dB), Signal, UPlink Packet,
 * Confirm Packet, Packet Loss (%), Longitude, Latitude, Location, SF, TX Power.
 */
export function parseLoraMeasuresCsv(
  text: string,
  fileName?: string
): CreateLoraMeasureInput[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const headers = rows[0];
  const dataRows = rows.slice(1);

  const norm = headers.map(normalize);
  const findN = (frags: string[], pick?: (key: string) => boolean): number => {
    for (const frag of frags) {
      const key = normalize(frag);
      let idx = norm.findIndex((k) => k === key);
      if (idx === -1) {
        idx = norm.findIndex((k) => k.startsWith(key) && (!pick || pick(k)));
      }
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idx: CsvIndex = {
    txCnt: findN(["txcnt", "tx"]),
    time: findN(["time"]),
    rssi: findN(["rssidbm", "rssi"], (k) => !k.startsWith("rssis")),
    rssis: findN(["rssisdbm", "rssis"], (k) => k.startsWith("rssis")),
    snr: findN(["snrdb", "snr"], (k) => k.startsWith("snr")),
    signal: findN(["signal", "senal", "strength"]),
    uplinkPacket: findN(["uplinkpacket", "uplink", "ulpacket"]),
    confirmPacket: findN(["confirmpacket", "confirm"]),
    packetLossPct: findN(["packetloss", "loss"]),
    longitude: findN(["longitude", "lon", "long"]),
    latitude: findN(["latitude", "lat"]),
    location: findN(["location", "ubicacion"]),
    sf: findN(["sf"]),
    txPower: findN(["txpower", "power"]),
  };

  const samples: LoraSampleInput[] = [];
  for (const dataRow of dataRows) {
    const get = (i: number) => getRowCell(dataRow, i);
    const sample: LoraSampleInput = {
      txCnt: idx.txCnt >= 0 ? toInt(get(idx.txCnt)) : null,
      time: get(idx.time)?.trim() || null,
      rssi: idx.rssi >= 0 ? toNum(get(idx.rssi)) : null,
      rssis: idx.rssis >= 0 ? toNum(get(idx.rssis)) : null,
      snr: idx.snr >= 0 ? toNum(get(idx.snr)) : null,
      signal: get(idx.signal)?.trim() || null,
      uplinkPacket:
        idx.uplinkPacket >= 0 ? toInt(get(idx.uplinkPacket)) : null,
      confirmPacket:
        idx.confirmPacket >= 0 ? toInt(get(idx.confirmPacket)) : null,
      packetLossPct:
        idx.packetLossPct >= 0 ? toNum(get(idx.packetLossPct)) : null,
      longitude: toCoord(get(idx.longitude)),
      latitude: toCoord(get(idx.latitude)),
      location: get(idx.location)?.trim() || null,
      sf: get(idx.sf)?.trim() || null,
      txPower: get(idx.txPower)?.trim() || null,
    };
    const hasData = Object.values(sample).some(
      (v) => v !== null && v !== undefined && v !== ""
    );
    if (hasData) samples.push(sample);
  }

  if (samples.length === 0) return [];

  const first = samples[0];
  const location = samples.find((s) => s.location)?.location ?? first.location;
  return [
    {
      source: fileName?.trim() || null,
      location: location ?? null,
      time: first.time ?? null,
      spreadingFactor: first.sf ?? null,
      txPower: first.txPower ?? null,
      samples,
    },
  ];
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
      longitude:
        idx.longitude >= 0 ? toCoord(getRowCell(firstRow, idx.longitude)) : null,
      latitude:
        idx.latitude >= 0 ? toCoord(getRowCell(firstRow, idx.latitude)) : null,
      entries,
    },
  ];
}