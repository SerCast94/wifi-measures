import { useMemo } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent } from "@/core/atomic-components/card";
import type { AnalysisHost } from "../../types/analysis.types";

const BAND_COLORS: Record<string, string> = {
  "2.4 GHz": "#f59e0b",
  "5 GHz": "#3b82f6",
  "6 GHz": "#8b5cf6",
};

const PIE_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
  "#ec4899",
  "#6b7280",
];

const SIGNAL_BUCKETS = [
  { label: "-30…-49", min: -50, max: -30 },
  { label: "-50…-59", min: -60, max: -50 },
  { label: "-60…-66", min: -67, max: -60 },
  { label: "-67…-74", min: -75, max: -67 },
  { label: "-75…-84", min: -85, max: -75 },
  { label: "≤ -85", min: -999, max: -85 },
];

const SNR_BUCKETS = [
  { label: "< 10", min: 0, max: 10 },
  { label: "10–19", min: 10, max: 20 },
  { label: "20–29", min: 20, max: 30 },
  { label: "30–39", min: 30, max: 40 },
  { label: "40+", min: 40, max: 999 },
];

interface AnalysisChartsProps {
  hosts: AnalysisHost[];
}

export const AnalysisCharts = ({ hosts }: AnalysisChartsProps) => {
  const charts = useMemo(() => {
    const byBand = new Map<string, number>();
    const bySecurity = new Map<string, number>();
    const byChannel = new Map<string, Record<string, number>>();
    const clientsBySsid = new Map<string, Set<string>>();
    const signalBuckets = SIGNAL_BUCKETS.map((bucket) => ({
      ...bucket,
      count: 0,
    }));
    const snrBuckets = SNR_BUCKETS.map((bucket) => ({ ...bucket, count: 0 }));

    for (const host of hosts) {
      if (host.band) {
        byBand.set(host.band, (byBand.get(host.band) ?? 0) + 1);
      }
      if (host.securityType) {
        bySecurity.set(
          host.securityType,
          (bySecurity.get(host.securityType) ?? 0) + 1
        );
      }
      if (
        (host.hostType === "ap" || host.hostType === "bssid") &&
        host.channel
      ) {
        const band = host.band ?? "Otra";
        const entry = byChannel.get(host.channel) ?? {};
        entry[band] = (entry[band] ?? 0) + 1;
        byChannel.set(host.channel, entry);
      }
      if (host.hostType === "client" && host.ssid && host.mac) {
        if (!clientsBySsid.has(host.ssid)) {
          clientsBySsid.set(host.ssid, new Set());
        }
        clientsBySsid.get(host.ssid)?.add(host.mac);
      }
      if (host.signal != null) {
        const bucket = signalBuckets.find(
          (b) => host.signal! >= b.min && host.signal! < b.max
        );
        if (bucket) bucket.count += 1;
      }
      if (host.snr != null) {
        const bucket = snrBuckets.find(
          (b) => host.snr! >= b.min && host.snr! < b.max
        );
        if (bucket) bucket.count += 1;
      }
    }

    const bandData = [...byBand.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const securityData = [...bySecurity.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const channelData = [...byChannel.entries()]
      .map(([channel, bands]) => ({
        canal: `Ch ${channel}`,
        orden: Number(channel),
        ...bands,
      }))
      .sort((a, b) => a.orden - b.orden);

    const topSsidsData = [...clientsBySsid.entries()]
      .map(([ssid, clients]) => ({ ssid, clientes: clients.size }))
      .sort((a, b) => b.clientes - a.clientes)
      .slice(0, 10);

    return {
      bandData,
      securityData,
      channelData,
      topSsidsData,
      signalBuckets,
      snrBuckets,
      channelBands: [...new Set(channelData.flatMap((c) => Object.keys(c).filter(k => k !== "canal" && k !== "orden")))],
    };
  }, [hosts]);

  const hasData = hosts.length > 0;

  if (!hasData) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Sin datos de dispositivos para generar gráficas.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardContent className="p-4">
          <p className="mb-2 text-sm font-semibold">Dispositivos por banda</p>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.bandData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {charts.bandData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={BAND_COLORS[entry.name] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="mb-2 text-sm font-semibold">Tipos de seguridad</p>
          {charts.securityData.length > 0 ? (
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.securityData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {charts.securityData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Sin información de seguridad.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="mb-2 text-sm font-semibold">
            Distribución de nivel de señal (dBm)
          </p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.signalBuckets} margin={{ top: 4, right: 8, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Dispositivos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="mb-2 text-sm font-semibold">Distribución de SNR (dB)</p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.snrBuckets} margin={{ top: 4, right: 8, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" fontSize={11} tickLine={false} />
                <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Dispositivos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="mb-2 text-sm font-semibold">APs/BSSIDs por canal</p>
          {charts.channelData.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.channelData} margin={{ top: 4, right: 8, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="canal" fontSize={10} tickLine={false} interval={0} angle={-45} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Legend />
                  {charts.channelBands.map((band) => (
                    <Bar key={band} dataKey={band} stackId="a" fill={BAND_COLORS[band] ?? "#94a3b8"} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Sin información de canales.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="mb-2 text-sm font-semibold">Top SSIDs por clientes</p>
          {charts.topSsidsData.length > 0 ? (
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={charts.topSsidsData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} fontSize={11} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="ssid"
                    width={140}
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v: string) =>
                      v.length > 18 ? `${v.slice(0, 17)}…` : v
                    }
                  />
                  <Tooltip />
                  <Bar dataKey="clientes" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Sin clientes asociados a SSIDs.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
